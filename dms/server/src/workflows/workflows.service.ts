import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption/encryption.service';
import { DocumentsService } from '../documents/documents.service';
import { ApproveStepDto } from './dto/approve-step.dto';
import { RejectStepDto, RejectType } from './dto/reject-step.dto';
import {
  Actor,
  loadActor,
  lockEntity,
  requireDocumentOwner,
  requirePermission,
  permissions,
} from '../common/document-policy';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs';

@Injectable()
export class WorkflowsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private documents: DocumentsService,
  ) {}

  async submitWorkflow(
    documentId: string,
    userId: string,
    customSteps?: Array<{ step_order: number; approver_id?: string }>,
  ) {
    const actor = await loadActor(this.prisma, userId);
    requirePermission(actor, permissions.submit);
    const original = await this.documents.getDocument(documentId);
    return this.prisma.$transaction(
      async (tx) => {
        await lockEntity(tx, `document:${original.id}`);
        await lockEntity(tx, `matrix:${original.type_id}`);
        const doc = await this.documents.getDocument(original.id, tx);
        requireDocumentOwner(doc, actor);
        if (!['Draft', 'Returned'].includes(doc.status))
          throw new ConflictException('ส่งอนุมัติได้เฉพาะร่างหรือส่งกลับแก้ไข');
        if (!doc.type.is_active)
          throw new BadRequestException('ประเภทเอกสารถูกปิดใช้งาน');
        const matrix = await tx.approvalMatrix.findMany({
          where: { document_type_id: doc.type_id },
          include: { required_role: true },
          orderBy: { step_order: 'asc' },
        });
        if (
          !matrix.length ||
          matrix.some(
            (m, i) => m.step_order !== i + 1 || !m.required_role.is_active,
          )
        )
          throw new BadRequestException(
            'กรุณาตั้งสายอนุมัติใน Master Data ให้ครบก่อนส่ง',
          );
        if (
          customSteps &&
          (customSteps.length !== matrix.length ||
            customSteps.some((s, i) => s.step_order !== i + 1))
        )
          throw new BadRequestException('จำนวนและลำดับขั้นต้องตรง Master Data');
        const steps: {
          step_order: number;
          approver_id: string;
          status: 'Pending';
        }[] = [];
        for (const m of matrix) {
          const selected =
            customSteps?.find((s) => s.step_order === m.step_order)
              ?.approver_id ??
            doc.workflow?.steps.find((s) => s.step_order === m.step_order)
              ?.approver_id;
          if (!selected)
            throw new BadRequestException(
              `กรุณาเลือกผู้อนุมัติขั้นที่ ${m.step_order}`,
            );
          const approver = await loadActor(tx, selected);
          if (approver.role_id !== m.required_role_id)
            throw new BadRequestException(
              `ผู้อนุมัติขั้นที่ ${m.step_order} ต้องมีบทบาท ${m.required_role.name}`,
            );
          requirePermission(approver, ['approvals.approve_document:approve']);
          steps.push({
            step_order: m.step_order,
            approver_id: approver.id,
            status: 'Pending',
          });
        }
        const latest = doc.versions[0];
        if (!latest) throw new BadRequestException('ไม่พบ version เอกสาร');
        if (
          !['PR', 'PO', 'BK'].includes(doc.type.prefix) &&
          !latest.file_data?.length
        )
          throw new BadRequestException('ไม่พบไฟล์ PDF');
        await this.documents.preserveLegacyVersion(tx, doc);
        const previous = latest.form_data as any;
        const history = [
          ...(previous?._meta?.workflow_history ?? []),
          ...(doc.workflow
            ? [
                (
                  this.documents.snapshotDocument(
                    doc,
                    undefined,
                    previous,
                  ) as any
                )._meta.workflow,
              ]
            : []),
        ];
        if (doc.workflow)
          await tx.workflow.delete({ where: { id: doc.workflow.id } });
        await tx.workflow.create({
          data: {
            document_id: doc.id,
            total_steps: steps.length,
            current_step: 1,
            status: 'Pending',
            steps: { create: steps },
          },
        });
        await tx.document.update({
          where: { id: doc.id },
          data: { status: 'Pending', approved_at: null },
        });
        const current = await this.documents.getDocument(doc.id, tx);
        const retained = {
          ...previous,
          _meta: { ...previous?._meta, workflow_history: history },
        };
        const buffer = !['PR', 'PO', 'BK'].includes(doc.type.prefix)
          ? Buffer.from(latest.file_data!)
          : undefined;
        await this.documents.appendVersion(
          tx,
          current,
          actor.id,
          'ส่งขออนุมัติ',
          buffer,
          undefined,
          retained,
        );
        await tx.notification.create({
          data: {
            user_id: steps[0].approver_id,
            document_id: doc.id,
            message: `เอกสาร ${doc.doc_number} รอการอนุมัติจากคุณ (ขั้นตอนที่ 1)`,
          },
        });
        await tx.auditLog.create({
          data: {
            user_id: actor.id,
            action: 'Edit',
            module: 'Workflow',
            target_id: doc.id,
            details: {
              oldState: { status: doc.status },
              newState: { status: 'Pending' },
              extra: { total_steps: steps.length, doc_number: doc.doc_number },
            },
          },
        });
        return { success: true, doc_number: doc.doc_number, status: 'Pending' };
      },
      { timeout: 60000, maxWait: 30000 },
    );
  }

  async getApprovalsForUser(userId: string, canViewAll = false) {
    const actor = await loadActor(this.prisma, userId);
    requirePermission(actor, [
      'approvals.view_list:view',
      'approvals.view_all:view',
    ]);
    canViewAll =
      canViewAll && !!actor.permissions?.includes('approvals.view_all:view');
    const rows = await this.prisma.workflowStep.findMany({
      where: {
        status: 'Pending',
        ...(canViewAll ? {} : { approver_id: userId }),
        workflow: {
          status: 'Pending',
          document: { is_deleted: false, status: 'Pending' },
        },
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
              include: {
                approver: { select: { first_name: true, last_name: true } },
              },
              orderBy: { step_order: 'asc' },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
    return rows
      .filter((s) => s.step_order === s.workflow.current_step)
      .map((s) => {
        const d = s.workflow.document;
        return {
          id: d.doc_number,
          real_id: d.id,
          docId: d.doc_number,
          name: d.title,
          docName: d.title,
          type: d.type.prefix,
          doc_type: d.type.type_name,
          sender: `${d.creator.first_name} ${d.creator.last_name}`,
          requester: `${d.creator.first_name} ${d.creator.last_name}`,
          department: d.creator.department?.name ?? '',
          approvers: s.workflow.steps.map((st) =>
            st.approver
              ? `${st.approver.first_name} ${st.approver.last_name}`
              : '',
          ),
          submittedDate: s.workflow.created_at,
          amount:
            d.pr_form || d.po_form
              ? `฿${Number(d.pr_form?.total_amount ?? d.po_form?.total_amount).toLocaleString()}`
              : '-',
          status: d.status,
          stepStatus: s.status,
          stepOrder: s.step_order,
          currentLevel: s.step_order,
          totalSteps: s.workflow.total_steps,
          maxLevels: s.workflow.total_steps,
          comment: s.comment,
        };
      });
  }

  async getWorkflowByDoc(documentId: string, actor: Actor) {
    const doc = await this.documents.findOne(documentId, actor);
    const workflow = doc.workflow;
    return workflow
      ? {
          id: workflow.id,
          document_id: doc.real_id,
          status: workflow.status,
          total_steps: workflow.total_steps,
          current_step: workflow.current_step,
          steps: workflow.steps.map((s: any) => ({
            id: s.id,
            step_order: s.step_order,
            approver_id: s.approver_id,
            approver_name: s.approver
              ? `${s.approver.first_name} ${s.approver.last_name}`
              : '',
            approver_role: s.approver?.role?.name ?? '',
            status: s.status,
            action_date: s.action_date,
            comment: s.comment,
            signature_applied: s.signature_applied,
            signature_url: s.signature_url,
          })),
        }
      : {
          document_id: doc.real_id,
          status: doc.status,
          total_steps: 0,
          current_step: 0,
          steps: [],
        };
  }

  private assertCurrent(
    doc: Awaited<ReturnType<DocumentsService['getDocument']>>,
    actor: Actor,
    expectedStep?: number,
    expectedVersion?: number,
  ) {
    if (doc.status !== 'Pending' || doc.workflow?.status !== 'Pending')
      throw new ConflictException('เอกสารไม่ได้อยู่ระหว่างอนุมัติ');
    const step = doc.workflow.steps.find(
      (s) => s.step_order === doc.workflow!.current_step,
    );
    if (!step || step.status !== 'Pending')
      throw new ConflictException('ขั้นอนุมัตินี้สิ้นสุดแล้ว');
    if (step.approver_id !== actor.id)
      throw new ForbiddenException('คุณไม่ใช่ผู้อนุมัติที่กำหนดในขั้นปัจจุบัน');
    if (
      (expectedStep !== undefined && expectedStep !== step.step_order) ||
      (expectedVersion !== undefined &&
        expectedVersion !== doc.versions[0]?.version_number)
    )
      throw new ConflictException('เอกสารเปลี่ยนแล้ว กรุณาโหลดข้อมูลล่าสุด');
    return step;
  }

  async approveStep(documentId: string, userId: string, dto: ApproveStepDto) {
    const actor = await loadActor(this.prisma, userId);
    requirePermission(actor, ['approvals.approve_document:approve']);
    requirePermission(actor, ['approvals.place_signature:approve']);
    const original = await this.documents.getDocument(documentId);
    return this.prisma.$transaction(
      async (tx) => {
        await lockEntity(tx, `document:${original.id}`);
        const doc = await this.documents.getDocument(original.id, tx);
        const step = this.assertCurrent(
          doc,
          actor,
          dto.expected_step,
          dto.expected_version,
        );
        const approver = await tx.user.findUnique({
          where: { id: userId },
          select: { signature_encrypted: true },
        });
        if (!approver?.signature_encrypted)
          throw new BadRequestException(
            'กรุณาบันทึกลายเซ็น PNG/JPEG ในโปรไฟล์ก่อนอนุมัติ',
          );
        let uri: string;
        try {
          uri = this.encryption.decrypt(approver.signature_encrypted);
        } catch {
          throw new BadRequestException(
            'อ่านลายเซ็นไม่ได้ กรุณาบันทึกลายเซ็นใหม่',
          );
        }
        const image = uri.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
        if (!image)
          throw new BadRequestException('รองรับลายเซ็น PNG/JPEG เท่านั้น');
        await this.documents.preserveLegacyVersion(tx, doc);
        const imageBytes = Buffer.from(image[2], 'base64');
        try {
          const validator = await PDFDocument.create();
          if (image[1] === 'image/jpeg') await validator.embedJpg(imageBytes);
          else await validator.embedPng(imageBytes);
        } catch {
          throw new BadRequestException(
            'ลายเซ็นเสียหาย กรุณาบันทึกลายเซ็นใหม่',
          );
        }
        const completed = step.step_order === doc.workflow!.total_steps;
        let folderId = doc.folder_id;
        if (completed && !folderId && doc.creator.department_id)
          folderId =
            (
              await tx.folder.findFirst({
                where: {
                  visibility: 'Department',
                  department_id: doc.creator.department_id,
                  is_deleted: false,
                  parent_id: null,
                },
              })
            )?.id ?? null;
        await tx.workflowStep.update({
          where: { id: step.id },
          data: {
            status: 'Approved',
            action_date: new Date(),
            comment: dto.comment,
            signature_applied: true,
          },
        });
        await tx.workflow.update({
          where: { id: doc.workflow!.id },
          data: completed
            ? { status: 'Approved' }
            : { current_step: step.step_order + 1 },
        });
        await tx.document.update({
          where: { id: doc.id },
          data: {
            status: completed ? 'Approved' : 'Pending',
            ...(completed
              ? { approved_at: new Date(), folder_id: folderId }
              : {}),
          },
        });
        const current = await this.documents.getDocument(doc.id, tx);
        const previous = doc.versions[0]?.form_data as any;
        const annotations = [
          ...(previous?._meta?.annotations ?? []),
          ...(dto.annotation_text || dto.date_stamp
            ? [
                {
                  user_id: actor.id,
                  text: dto.annotation_text ?? '',
                  date: dto.date_stamp ? new Date().toISOString() : null,
                },
              ]
            : []),
        ];
        const retained = {
          ...previous,
          _meta: { ...previous?._meta, annotations },
        };
        let bytes: Buffer;
        if (['PR', 'PO', 'BK'].includes(doc.type.prefix)) {
          const snapshot = this.documents.snapshotDocument(
            current,
            undefined,
            retained,
          );
          bytes = await this.documents.generateFallbackPdf(current, {
            form_data: snapshot,
          });
        } else {
          const file = doc.versions[0]?.file_data;
          if (!file) throw new BadRequestException('ไม่พบไฟล์ PDF');
          try {
            const pdf = await PDFDocument.load(file),
              pageIndex = (dto.signature_page ?? 1) - 1;
            if (pageIndex < 0 || pageIndex >= pdf.getPageCount())
              throw new Error('หน้าลายเซ็นไม่ถูกต้อง');
            const page = pdf.getPage(pageIndex),
              width = dto.signature_width ?? 120,
              height = dto.signature_height ?? 60;
            const x = dto.signature_x ?? 36 + ((step.step_order - 1) % 3) * 170;
            const y =
              dto.signature_y ??
              60 + Math.floor((step.step_order - 1) / 3) * 90;
            if (
              x < 0 ||
              y < 0 ||
              width <= 0 ||
              height <= 0 ||
              x + width > page.getWidth() ||
              y + height > page.getHeight()
            )
              throw new Error('ลายเซ็นอยู่นอกหน้า PDF');
            const signature =
              image[1] === 'image/jpeg'
                ? await pdf.embedJpg(imageBytes)
                : await pdf.embedPng(imageBytes);
            page.drawImage(signature, { x, y, width, height });
            if (dto.annotation_text || dto.date_stamp) {
              let font = await pdf.embedFont(StandardFonts.Helvetica);
              const fontPath =
                process.env.PDF_FONT_PATH || 'C:/Windows/Fonts/tahoma.ttf';
              if (fs.existsSync(fontPath)) {
                pdf.registerFontkit(fontkit);
                font = await pdf.embedFont(fs.readFileSync(fontPath));
              }
              const text = [
                dto.annotation_text,
                dto.date_stamp
                  ? new Date().toLocaleString('th-TH', {
                      timeZone: 'Asia/Bangkok',
                    })
                  : '',
              ]
                .filter(Boolean)
                .join(' ');
              page.drawText(text, {
                x,
                y: y >= 40 ? y - 20 : y + height + 20,
                size: 9,
                font,
                maxWidth: Math.min(
                  Math.max(width, 170),
                  page.getWidth() - x - 12,
                ),
                lineHeight: 12,
              });
            }
            bytes = Buffer.from(await pdf.save());
          } catch (error) {
            throw new BadRequestException(
              `ไม่สามารถลงลายเซ็น PDF: ${error instanceof Error ? error.message : 'ไฟล์ไม่ถูกต้อง'}`,
            );
          }
        }
        const version = await this.documents.appendVersion(
          tx,
          current,
          actor.id,
          completed
            ? 'อนุมัติเสร็จสิ้น'
            : `อนุมัติขั้นตอนที่ ${step.step_order}`,
          bytes,
          undefined,
          retained,
        );
        await tx.notification.create({
          data: {
            user_id: doc.creator_id,
            document_id: doc.id,
            message: completed
              ? `เอกสาร ${doc.doc_number} ได้รับการอนุมัติครบถ้วนแล้ว`
              : `เอกสาร ${doc.doc_number} ผ่านการอนุมัติขั้นตอนที่ ${step.step_order}`,
          },
        });
        const next = current.workflow!.steps.find(
          (s) => s.step_order === step.step_order + 1,
        );
        if (!completed && next?.approver_id)
          await tx.notification.create({
            data: {
              user_id: next.approver_id,
              document_id: doc.id,
              message: `เอกสาร ${doc.doc_number} รอการอนุมัติจากคุณ (ขั้นตอนที่ ${next.step_order})`,
            },
          });
        for (const action of ['Approve', 'Signature'] as const)
          await tx.auditLog.create({
            data: {
              user_id: actor.id,
              action,
              module: 'Workflow',
              target_id: doc.id,
              details: {
                oldState: { status: doc.status, current_step: step.step_order },
                newState: {
                  status: current.status,
                  current_step: current.workflow!.current_step,
                },
                extra: {
                  doc_number: doc.doc_number,
                  version: version.version_number,
                  comment: dto.comment,
                },
              },
            },
          });
        return {
          success: true,
          is_completed: completed,
          signature_applied: true,
          new_version: version.version_number,
        };
      },
      { timeout: 60000, maxWait: 30000 },
    );
  }

  async rejectStep(documentId: string, userId: string, dto: RejectStepDto) {
    const actor = await loadActor(this.prisma, userId);
    requirePermission(actor, [
      dto.reject_type === RejectType.RETURN
        ? 'approvals.return_document:approve'
        : 'approvals.reject_document:approve',
    ]);
    const original = await this.documents.getDocument(documentId);
    return this.prisma.$transaction(
      async (tx) => {
        await lockEntity(tx, `document:${original.id}`);
        const doc = await this.documents.getDocument(original.id, tx);
        const step = this.assertCurrent(
          doc,
          actor,
          dto.expected_step,
          dto.expected_version,
        );
        await this.documents.preserveLegacyVersion(tx, doc);
        const status =
          dto.reject_type === RejectType.RETURN ? 'Returned' : 'Rejected';
        await tx.workflowStep.update({
          where: { id: step.id },
          data: {
            status: 'Rejected',
            action_date: new Date(),
            comment: dto.comment,
            return_to_step: dto.reject_type === RejectType.RETURN ? 1 : null,
          },
        });
        await tx.workflow.update({
          where: { id: doc.workflow!.id },
          data: { status: 'Rejected' },
        });
        await tx.document.update({
          where: { id: doc.id },
          data: { status, approved_at: null },
        });
        const current = await this.documents.getDocument(doc.id, tx),
          latest = doc.versions[0];
        const bytes = latest?.file_data
          ? Buffer.from(latest.file_data)
          : await this.documents.generateFallbackPdf(doc, latest);
        await this.documents.appendVersion(
          tx,
          current,
          actor.id,
          `${status === 'Returned' ? 'ตีกลับแก้ไข' : 'ไม่อนุมัติ'}: ${dto.comment}`,
          bytes,
        );
        await tx.notification.create({
          data: {
            user_id: doc.creator_id,
            document_id: doc.id,
            message: `เอกสาร ${doc.doc_number} ${status === 'Returned' ? 'ถูกส่งกลับแก้ไข' : 'ถูกปฏิเสธ'}: ${dto.comment}`,
          },
        });
        await tx.auditLog.create({
          data: {
            user_id: actor.id,
            action: 'Reject',
            module: 'Workflow',
            target_id: doc.id,
            details: {
              oldState: { status: doc.status },
              newState: { status },
              extra: { comment: dto.comment, doc_number: doc.doc_number },
            },
          },
        });
        return {
          success: true,
          doc_status: status,
          reject_type: dto.reject_type,
        };
      },
      { timeout: 60000 },
    );
  }
}
