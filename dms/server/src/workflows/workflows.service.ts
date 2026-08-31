import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { ApproveStepDto } from './dto/approve-step.dto';
import { RejectStepDto } from './dto/reject-step.dto';
import { PDFDocument } from 'pdf-lib';

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async submitWorkflow(documentId: string, userId: string, customSteps?: Array<{ step_order: number; approver_id?: string }>) {
    const doc = await this.prisma.document.findFirst({
      where: {
        OR: [{ id: documentId }, { doc_number: documentId }],
        is_deleted: false,
      },
      include: {
        type: true,
        workflow: true,
      },
    });

    if (!doc) {
      throw new NotFoundException('ไม่พบเอกสาร');
    }

    if (doc.status !== 'Draft' && doc.status !== 'Returned') {
      throw new BadRequestException('เอกสารไม่ได้อยู่ในสถานะร่างหรือส่งกลับแก้ไข ไม่สามารถส่งอนุมัติได้');
    }

    // 1. Resolve steps (from ApprovalMatrix or Custom/System default)
    let stepsToCreate: Array<{ step_order: number; approver_id: string | null; status: 'Pending' }> = [];

    if (customSteps && customSteps.length > 0) {
      // Map custom steps with robust user resolution (support UUID, username, or full name)
      stepsToCreate = await Promise.all(
        customSteps.map(async (s) => {
          let resolvedApproverId: string | null = null;
          const targetId = s.approver_id?.trim();

          if (targetId) {
            // 1. Try finding user by exact UUID
            const userById = await this.prisma.user.findFirst({
              where: { id: targetId, is_active: true, is_deleted: false },
            });
            if (userById) {
              resolvedApproverId = userById.id;
            } else {
              // 2. Try finding user by username
              const userByUsername = await this.prisma.user.findFirst({
                where: { username: targetId, is_active: true, is_deleted: false },
              });
              if (userByUsername) {
                resolvedApproverId = userByUsername.id;
              } else {
                // 3. Try finding user by full name match
                const allUsers = await this.prisma.user.findMany({
                  where: { is_active: true, is_deleted: false },
                });
                const lowerTarget = targetId.toLowerCase();
                const match = allUsers.find(
                  (u) =>
                    `${u.first_name} ${u.last_name}`.trim().toLowerCase() === lowerTarget ||
                    u.first_name.trim().toLowerCase() === lowerTarget
                );
                if (match) resolvedApproverId = match.id;
              }
            }
          }

          // Fallback if still unassigned
          if (!resolvedApproverId) {
            const adminUser = await this.prisma.user.findFirst({
              where: { role: { name: 'Administrator' }, is_active: true, is_deleted: false },
            });
            const fallbackUser =
              adminUser ||
              (await this.prisma.user.findFirst({
                where: { is_active: true, is_deleted: false },
              }));
            resolvedApproverId = fallbackUser?.id || null;
          }

          return {
            step_order: s.step_order,
            approver_id: resolvedApproverId,
            status: 'Pending' as const,
          };
        })
      );
    } else {
      const creatorUser = await this.prisma.user.findUnique({
        where: { id: doc.creator_id },
      });
      const creatorDeptId = creatorUser?.department_id;

      // Load template from matrix
      const matrix = await this.prisma.approvalMatrix.findMany({
        where: { document_type_id: doc.type_id },
        orderBy: { step_order: 'asc' },
      });

      if (matrix.length > 0) {
        stepsToCreate = [];
        for (const m of matrix) {
          let resolvedApproverId: string | null = null;
          if (creatorDeptId) {
            const deptApprover = await this.prisma.user.findFirst({
              where: {
                role_id: m.required_role_id,
                department_id: creatorDeptId,
                is_active: true,
                is_deleted: false,
              },
            });
            if (deptApprover) resolvedApproverId = deptApprover.id;
          }

          if (!resolvedApproverId) {
            const roleApprover = await this.prisma.user.findFirst({
              where: {
                role_id: m.required_role_id,
                is_active: true,
                is_deleted: false,
              },
            });
            if (roleApprover) resolvedApproverId = roleApprover.id;
          }

          stepsToCreate.push({
            step_order: m.step_order,
            approver_id: resolvedApproverId,
            status: 'Pending',
          });
        }
      } else {
        // Default single step: resolve admin user as fallback
        const adminUser = await this.prisma.user.findFirst({
          where: { role: { name: 'Administrator' }, is_active: true, is_deleted: false },
        });
        stepsToCreate = [{ step_order: 1, approver_id: adminUser?.id || null, status: 'Pending' }];
      }
    }

    // Use transaction to create workflow, steps, update document status, notify first approver, and log audit log
    const result = await this.prisma.$transaction(async (tx) => {
      // Delete old workflow if exists
      if (doc.workflow) {
        await tx.workflowStep.deleteMany({ where: { workflow_id: doc.workflow.id } });
        await tx.workflow.delete({ where: { id: doc.workflow.id } });
      }

      // Create new workflow
      const workflow = await tx.workflow.create({
        data: {
          document_id: doc.id,
          total_steps: stepsToCreate.length,
          current_step: 1,
          status: 'Pending',
          steps: {
            create: stepsToCreate,
          },
        },
        include: {
          steps: { orderBy: { step_order: 'asc' } },
        },
      });

      // Update doc status to Pending
      const updatedDoc = await tx.document.update({
        where: { id: doc.id },
        data: { status: 'Pending' },
      });

      // Create notification for first step approver (if assigned)
      const firstStep = workflow.steps[0];
      if (firstStep && firstStep.approver_id) {
        await tx.notification.create({
          data: {
            user_id: firstStep.approver_id,
            document_id: doc.id,
            message: `เอกสาร ${doc.doc_number} รอการอนุมัติจากคุณ`,
          },
        });
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: 'Approve', // Submit to workflow falls under Approval lifecycle
          module: 'Workflow',
          target_id: doc.id,
          details: {
            oldState: { status: 'Draft' },
            newState: { status: 'Pending' },
            extra: { doc_number: doc.doc_number, total_steps: stepsToCreate.length },
          },
        },
      });

      return {
        document: updatedDoc,
        workflow,
      };
    });

    return {
      success: true,
      doc_number: result.document.doc_number,
      status: result.document.status,
    };
  }

  async getApprovalsForUser(userId: string) {
    const steps = await this.prisma.workflowStep.findMany({
      where: {
        approver_id: userId,
      },
      include: {
        workflow: {
          include: {
            document: {
              include: {
                creator: { include: { department: true } },
                type: true,
                pr_form: true,
                po_form: true,
              },
            },
            steps: {
              include: { approver: true },
              orderBy: { step_order: 'asc' },
            },
          },
        },
      },
      orderBy: { workflow: { created_at: 'desc' } },
    });

    const activeSteps = steps.filter((s) => {
      // Only show steps that are Pending AND are the current step in the workflow.
      // If the workflow is already Rejected/Returned/Approved, it shouldn't show in the pending list.
      return s.status === 'Pending' && s.step_order === s.workflow.current_step && s.workflow.status === 'Pending';
    });

    return activeSteps.map((s) => {
      const doc = s.workflow.document;
      const creatorName = doc.creator
        ? `${doc.creator.first_name} ${doc.creator.last_name}`
        : 'ไม่ระบุ';
      const amount = doc.pr_form
        ? `฿${Number(doc.pr_form.total_amount).toLocaleString()}`
        : doc.po_form
          ? `฿${Number(doc.po_form.total_amount).toLocaleString()}`
          : '-';

      const approvers = (s.workflow.steps || [])
        .map((st) =>
          st.approver
            ? `${st.approver.first_name} ${st.approver.last_name}`
            : null,
        )
        .filter((name): name is string => Boolean(name));

      return {
        id: doc.doc_number || doc.id,
        real_id: doc.id,
        docId: doc.doc_number || doc.id,
        docName: doc.title,
        name: doc.title,
        type: doc.type?.prefix || 'PR',
        sender: creatorName,
        approvers,
        submittedDate: doc.created_at,
        amount,
        status: doc.status,
        stepStatus: s.status,
        stepOrder: s.step_order,
        totalSteps: s.workflow.total_steps,
        comment: s.comment,
      };
    });
  }

  async getWorkflowByDoc(documentId: string) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId);
    const doc = await this.prisma.document.findFirst({
      where: { OR: isUuid ? [{ id: documentId }, { doc_number: documentId }] : [{ doc_number: documentId }] },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');

    const workflow = await this.prisma.workflow.findUnique({
      where: { document_id: doc.id },
      include: {
        steps: {
          include: { approver: { include: { role: true } } },
          orderBy: { step_order: 'asc' },
        },
      },
    });

    if (!workflow) throw new NotFoundException('ไม่พบขั้นตอนการอนุมัติ');

    return {
      id: workflow.id,
      document_id: doc.id,
      total_steps: workflow.total_steps,
      current_step: workflow.current_step,
      status: workflow.status,
      steps: workflow.steps.map((s) => ({
        id: s.id,
        step_order: s.step_order,
        approver_id: s.approver_id,
        approver_name: s.approver
          ? `${s.approver.first_name} ${s.approver.last_name}`
          : 'ยังไม่ระบุตัวบุคคล',
        approver_role: s.approver?.role?.name || 'Approver',
        status: s.status,
        action_date: s.action_date
          ? new Date(s.action_date).toLocaleString('th-TH')
          : undefined,
        comment: s.comment,
        signature_applied: s.signature_applied,
        signature_url: s.approver?.signature_encrypted
          ? `/api/users/${s.approver.id}/signature`
          : null,
        approver: s.approver
          ? {
              id: s.approver.id,
              first_name: s.approver.first_name,
              last_name: s.approver.last_name,
              signature_url: s.approver.signature_encrypted
                ? `/api/users/${s.approver.id}/signature`
                : null,
            }
          : null,
      })),
    };
  }

  async approveStep(documentId: string, userId: string, dto: ApproveStepDto) {
    const doc = await this.prisma.document.findFirst({
      where: { OR: [{ id: documentId }, { doc_number: documentId }] },
      include: {
        versions: { orderBy: { version_number: 'desc' }, take: 1 },
      },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');

    const workflow = await this.prisma.workflow.findUnique({
      where: { document_id: doc.id },
      include: { steps: { orderBy: { step_order: 'asc' } } },
    });

    if (!workflow) throw new NotFoundException('ไม่พบ Workflow');

    const currentStepObj = workflow.steps.find(
      (s) => s.step_order === workflow.current_step,
    );

    if (!currentStepObj) {
      throw new BadRequestException('ไม่พบขั้นตอนปัจจุบันของการอนุมัติ');
    }

    const isLastStep = workflow.current_step >= workflow.total_steps;
    const hasSignature = dto.signature_x !== undefined && dto.signature_y !== undefined;

    // ---- PDF-LIB: ฝังลายเซ็นลงบน PDF (ถ้ามีพิกัด + มีไฟล์) ----
    let signedBuffer: Buffer | null = null;
    let newVersionNumber = 1;

    if (hasSignature) {
      const latestVersion = (doc as any).versions?.[0];

      if (!latestVersion?.file_data) {
        this.logger.warn(`No PDF version found for doc ${documentId} — skipping signature embed`);
      } else {
        const approver = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!approver?.signature_encrypted) {
          this.logger.warn(`Approver ${userId} has no signature — skipping PDF embed`);
        } else {
          try {
            const decryptedSig = this.encryption.decrypt(approver.signature_encrypted);
            let signatureBuffer: Buffer;
            let isJpg = false;

            const matches = decryptedSig.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
            if (matches) {
              const mime = matches[1];
              isJpg = mime.includes('jpeg') || mime.includes('jpg');
              signatureBuffer = Buffer.from(matches[2], 'base64');
            } else {
              signatureBuffer = Buffer.from(decryptedSig, 'base64');
            }

            const pdfBuffer = Buffer.from(latestVersion.file_data);
            const pdfDoc = await PDFDocument.load(pdfBuffer);
            const sigPage = dto.signature_page ? dto.signature_page - 1 : 0;
            const page = pdfDoc.getPage(sigPage);

            const sigImage = isJpg
              ? await pdfDoc.embedJpg(signatureBuffer)
              : await pdfDoc.embedPng(signatureBuffer);

            const sigWidth = dto.signature_width ?? 120;
            const sigHeight = dto.signature_height ?? 60;

            page.drawImage(sigImage, {
              x: dto.signature_x!,
              y: dto.signature_y!,
              width: sigWidth,
              height: sigHeight,
            });

            const signedPdfBytes = await pdfDoc.save();
            signedBuffer = Buffer.from(signedPdfBytes);
            newVersionNumber = latestVersion.version_number + 1;
          } catch (embedErr: any) {
            this.logger.warn(`PDF signature embed skipped for ${documentId}: ${embedErr.message}`);
            signedBuffer = null;
          }
        }
      }
    }

    // ---- Prisma $transaction: อัปเดต DB ทั้งหมด ----
    await this.prisma.$transaction(async (tx) => {
      // 1. อัปเดต WorkflowStep ปัจจุบัน
      await tx.workflowStep.update({
        where: { id: currentStepObj.id },
        data: {
          status: 'Approved',
          action_date: new Date(),
          comment: dto.comment,
          approver_id: userId,
          signature_applied: hasSignature,
        },
      });

      // 2. สร้าง DocumentVersion ใหม่ (ถ้ามีการฝังลายเซ็น)
      if (hasSignature && signedBuffer) {
        await tx.documentVersion.create({
          data: {
            document_id: doc.id,
            version_number: newVersionNumber,
            file_data: signedBuffer,
            file_extension: 'pdf',
            uploaded_by_id: userId,
            remarks: `ลายเซ็น Step ${workflow.current_step}`,
          },
        });
      }

      // 3. อัปเดต Workflow + Document
      if (isLastStep) {
        await tx.workflow.update({ where: { id: workflow.id }, data: { status: 'Approved' } });

        // Auto-assign department folder if not assigned yet
        let autoFolderId: string | null = doc.folder_id || null;
        if (!autoFolderId) {
          const creatorUser = await tx.user.findUnique({ where: { id: doc.creator_id } });
          if (creatorUser?.department_id) {
            const deptFolder = await tx.folder.findFirst({
              where: { department_id: creatorUser.department_id, is_deleted: false, visibility: 'Department' },
            });
            if (deptFolder) autoFolderId = deptFolder.id;
          }
        }

        await tx.document.update({
          where: { id: doc.id },
          data: { status: 'Approved', folder_id: autoFolderId, approved_at: new Date() },
        });
      } else {
        await tx.workflow.update({
          where: { id: workflow.id },
          data: { current_step: workflow.current_step + 1 },
        });
      }

      // 4. Notification for creator
      await tx.notification.create({
        data: {
          user_id: doc.creator_id,
          document_id: doc.id,
          message: isLastStep
            ? `เอกสาร ${doc.doc_number} ได้รับการอนุมัติครบถ้วนแล้ว`
            : `เอกสาร ${doc.doc_number} ผ่านการอนุมัติขั้นตอนที่ ${workflow.current_step}`,
        },
      });

      // 5. Notification for next approver (if not last step)
      if (!isLastStep) {
        const nextStep = workflow.steps.find((s) => s.step_order === workflow.current_step + 1);
        if (nextStep && nextStep.approver_id) {
          await tx.notification.create({
            data: {
              user_id: nextStep.approver_id,
              document_id: doc.id,
              message: `เอกสาร ${doc.doc_number} รอการอนุมัติจากคุณ (ขั้นตอนที่ ${workflow.current_step + 1})`,
            },
          });
        }
      }

      // 5. AuditLog
      await tx.auditLog.create({
        data: {
          user_id: userId,
          action: hasSignature ? 'Signature' : 'Approve',
          module: 'Workflow',
          target_id: doc.id,
          details: {
            oldState: { current_step: workflow.current_step, status: workflow.status },
            newState: {
              current_step: isLastStep ? workflow.current_step : workflow.current_step + 1,
              status: isLastStep ? 'Approved' : 'Pending',
            },
            extra: {
              doc_number: doc.doc_number,
              step: workflow.current_step,
              comment: dto.comment,
              signature_applied: hasSignature,
              new_version: newVersionNumber,
            },
          },
        },
      });
    });

    return {
      success: true,
      is_completed: isLastStep,
      signature_applied: hasSignature,
      new_version: hasSignature ? newVersionNumber : null,
    };
  }

  async rejectStep(documentId: string, userId: string, dto: RejectStepDto) {
    const doc = await this.prisma.document.findFirst({
      where: { OR: [{ id: documentId }, { doc_number: documentId }] },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');

    const workflow = await this.prisma.workflow.findUnique({
      where: { document_id: doc.id },
      include: { steps: { orderBy: { step_order: 'asc' } } },
    });

    if (!workflow) throw new NotFoundException('ไม่พบ Workflow');

    const currentStepObj = workflow.steps.find(
      (s) => s.step_order === workflow.current_step,
    );

    if (currentStepObj) {
      await this.prisma.workflowStep.update({
        where: { id: currentStepObj.id },
        data: {
          status: 'Rejected',
          action_date: new Date(),
          comment: dto.comment,
          return_to_step: dto.reject_type === 'return' ? dto.return_to_step : null,
          approver_id: userId,
        },
      });
    }

    const isReturn = dto.reject_type === 'return';
    const newDocStatus = isReturn ? 'Returned' : 'Rejected';
    const newWfStatus = 'Rejected';

    await this.prisma.workflow.update({
      where: { id: workflow.id },
      data: { status: newWfStatus },
    });

    await this.prisma.document.update({
      where: { id: doc.id },
      data: { status: newDocStatus },
    });

    // Notify creator
    const notifMessage = isReturn
      ? `เอกสาร ${doc.doc_number} ถูกตีกลับแก้ไข: ${dto.comment}`
      : `เอกสาร ${doc.doc_number} ถูกปฏิเสธถาวร: ${dto.comment}`;

    await this.prisma.notification.create({
      data: {
        user_id: doc.creator_id,
        document_id: doc.id,
        message: notifMessage,
      },
    });

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'Reject',
        module: 'Workflow',
        target_id: doc.id,
        details: {
          oldState: { status: doc.status },
          newState: { status: newDocStatus },
          extra: {
            doc_number: doc.doc_number,
            comment: dto.comment,
            reject_type: dto.reject_type,
            return_to_step: dto.return_to_step,
          },
        },
      },
    });

    return { success: true, reject_type: dto.reject_type, doc_status: newDocStatus };
  }
}
