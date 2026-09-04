import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

import { AuditAction } from '@prisma/client';

export interface FindAllOptions {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  currentUserId?: string;
  currentUserRole?: string;
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async logAction(userId: string, action: AuditAction, targetId: string, ipAddress: string, docNumber?: string) {
    // Fire and forget audit log
    this.prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        module: 'Document',
        target_id: targetId,
        ip_address: ipAddress,
        details: {
          extra: { comment: `User ${action.toLowerCase()}ed document`, doc_number: docNumber }
        }
      }
    }).catch(e => console.error('AuditLog error:', e));
  }

  async findAll(options: FindAllOptions) {
    const {
      status,
      type,
      search,
      page = 1,
      limit = 20,
      currentUserId,
      currentUserRole,
    } = options;

    const take = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    const where: any = { is_deleted: false };

    if (currentUserRole !== 'Administrator' && currentUserId) {
      where.OR = [
        { creator_id: currentUserId },
        { status: 'Approved' }
      ];
    }

    if (status && status !== 'All') {
      where.status = status;
    }

    if (type && type !== 'All') {
      where.type = { prefix: type };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { doc_number: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, docs] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        include: {
          type: true,
          creator: { include: { department: true } },
          pr_form: true,
          po_form: true,
          bk_form: true,
          versions: {
            orderBy: { version_number: 'desc' },
            take: 1,
          },
          workflow: {
          include: {
            steps: {
              include: { approver: { include: { role: true } } },
              orderBy: { step_order: 'asc' },
            },
          },
        },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      data: await Promise.all(docs.map((d) => this.mapDocumentToResponse(d))),
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      );
    const doc = await this.prisma.document.findFirst({
      where: {
        OR: isUuid ? [{ id }, { doc_number: id }] : [{ doc_number: id }],
        is_deleted: false,
      },
      include: {
        type: true,
        creator: {
          include: { department: true, position: true, role: true },
        },
        pr_form: { include: { items: true, department: true } },
        po_form: { include: { items: true } },
        bk_form: { include: { department: true } },
        versions: {
          include: { uploaded_by: true },
          orderBy: { version_number: 'desc' },
        },
        workflow: {
          include: {
            steps: {
              include: { approver: { include: { role: true } } },
              orderBy: { step_order: 'asc' },
            },
          },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException(`ไม่พบเอกสารรหัส ${id}`);
    }

    return await this.mapDocumentToResponse(doc);
  }

  async create(dto: CreateDocumentDto, creatorId: string) {
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });
    if (!creator || !creator.is_active) {
      throw new BadRequestException('ไม่พบข้อมูลผู้สร้างเอกสาร');
    }

    const deptId =
      creator.department_id ||
      (() => {
        throw new BadRequestException('ผู้ใช้ยังไม่ได้กำหนดแผนก');
      })();

    let prefix = (dto.prefix || 'PR').toUpperCase();
    if (prefix === 'MEMO') prefix = 'BK';

    const docType = await this.prisma.documentType.findFirst({
      where: { prefix },
    });
    if (!docType) {
      throw new BadRequestException(`ไม่พบประเภทเอกสาร prefix="${prefix}"`);
    }

    const docNumber = await this.prisma.$transaction(async (tx) => {
      let running = await tx.runningNumber.findUnique({
        where: { document_type_id: docType.id },
      });

      const currentYear = new Date().getFullYear();

      if (!running) {
        running = await tx.runningNumber.create({
          data: {
            document_type_id: docType.id,
            prefix: docType.prefix,
            year_format: 'YYYY',
            current_number: 0,
            padding_length: 4,
            last_reset_year: currentYear,
          },
        });
      }

      let nextNum = running.current_number + 1;
      let lastResetYear = running.last_reset_year;

      if (running.last_reset_year !== currentYear) {
        nextNum = 1;
        lastResetYear = currentYear;
      }

      await tx.runningNumber.update({
        where: { id: running.id },
        data: { current_number: nextNum, last_reset_year: lastResetYear },
      });

      const paddedStr = String(nextNum).padStart(running.padding_length, '0');
      return `${docType.prefix}-${currentYear}-${paddedStr}`;
    });

    let totalAmount = 0;
    const itemsData = (dto.items || []).map((item) => {
      const itemTotal =
        Number(item.quantity || 1) * Number(item.unit_price || 0);
      totalAmount += itemTotal;
      return {
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit || 'ชิ้น',
        unit_price: item.unit_price,
        total_price: itemTotal,
        remark: item.remark,
      };
    });

    const docData: any = {
      doc_number: docNumber,
      title: dto.title,
      type_id: docType.id,
      creator_id: creatorId,
      status: 'Draft',
    };

    if (prefix === 'PR') {
      docData.pr_form = {
        create: {
          requester_id: creatorId,
          department_id: deptId,
          purpose: dto.purpose || '',
          total_amount: totalAmount,
          requested_date: new Date(),
          items: { create: itemsData },
        },
      };
    } else if (prefix === 'PO') {
      docData.po_form = {
        create: {
          vendor_name: dto.purpose || 'Vendor',
          total_amount: totalAmount,
          items: { create: itemsData.map((it) => ({ ...it, vat: 7 })) },
        },
      };
    } else if (prefix === 'BK') {
      docData.bk_form = {
        create: {
          subject: dto.title,
          detail: dto.purpose || '',
          department_id: deptId,
        },
      };
    }

    const createdDoc = await this.prisma.document.create({
      data: docData,
      include: {
        type: true,
        creator: true,
        pr_form: true,
        po_form: true,
        bk_form: true,
        workflow: {
          include: {
            steps: {
              include: { approver: { include: { role: true } } },
              orderBy: { step_order: 'asc' },
            },
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: creatorId,
        action: 'Upload',
        module: 'Document',
        target_id: createdDoc.id,
        details: {
          newState: {
            id: createdDoc.id,
            doc_number: createdDoc.doc_number,
            title: createdDoc.title,
            status: createdDoc.status,
          },
        },
      },
    });

    return this.mapDocumentToResponse(createdDoc);
  }

  async createWithFile(
    dto: CreateDocumentDto,
    creatorId: string,
    file: Express.Multer.File,
    approverIds: string[] = [],
  ) {
    const doc = await this.create(dto, creatorId);

    try {
      // Store PDF buffer directly in Postgres
      const version = await this.prisma.documentVersion.create({
        data: {
          document_id: doc.real_id,
          version_number: 1,
          file_data: file.buffer,
          file_size: String(file.size),
          file_extension: 'pdf',
          uploaded_by_id: creatorId,
          remarks: 'Initial upload',
        },
      });

      return { ...doc, version_number: version.version_number };
    } catch (err) {
      await this.prisma.document.delete({ where: { id: doc.real_id } }).catch(() => {});
      throw err;
    }
  }

  async getLatestVersionDownloadUrl(id: string): Promise<{ url: string }> {
    const doc = await this.findOne(id);
    return { url: `/api/documents/${doc.real_id || doc.id}/download` };
  }

  async getFileBuffer(documentId: string, versionNumber?: number): Promise<Buffer> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        documentId,
      );

    const doc = await this.prisma.document.findFirst({
      where: {
        OR: isUuid ? [{ id: documentId }, { doc_number: documentId }] : [{ doc_number: documentId }],
        is_deleted: false,
      },
    });

    if (!doc) {
      throw new NotFoundException('ไม่พบเอกสาร');
    }

    const versionWhere: any = { document_id: doc.id };
    if (versionNumber) {
      versionWhere.version_number = Number(versionNumber);
    }

    const version = await this.prisma.documentVersion.findFirst({
      where: versionWhere,
      orderBy: { version_number: 'desc' },
    });

    if (!version || !version.file_data) {
      throw new NotFoundException('ไม่พบไฟล์ PDF ในฐานข้อมูล');
    }

    return version.file_data;
  }

  async softDelete(id: string, currentUser: { id: string; role: string }) {
    const doc = await this.prisma.document.findFirst({
      where: { OR: [{ id }, { doc_number: id }], is_deleted: false },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');

    const isOwner = doc.creator_id === currentUser.id;
    const isAdmin = currentUser.role === 'Administrator';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('ไม่มีสิทธิ์ลบเอกสารนี้');
    }

    await this.prisma.document.update({
      where: { id: doc.id },
      data: { is_deleted: true },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: currentUser.id,
        action: 'Delete',
        module: 'Document',
        target_id: doc.id,
        details: {
          oldState: { id: doc.id, doc_number: doc.doc_number, is_deleted: false },
          newState: { id: doc.id, doc_number: doc.doc_number, is_deleted: true },
        },
      },
    });

    return { success: true, message: 'ลบเอกสารสำเร็จ' };
  }

  private async mapDocumentToResponse(doc: any) {
    const creatorName = doc.creator
      ? `${doc.creator.first_name} ${doc.creator.last_name}`
      : 'ไม่ระบุ';

    const amount = doc.pr_form
      ? `฿${Number(doc.pr_form.total_amount).toLocaleString()}`
      : doc.po_form
        ? `฿${Number(doc.po_form.total_amount).toLocaleString()}`
        : '-';

    const creatorSigUrl = doc.creator?.signature_encrypted
      ? `/api/users/${doc.creator.id}/signature`
      : null;

    let workflow = doc.workflow;
    if (workflow && workflow.steps) {
      const stepsWithSig = workflow.steps.map((step: any) => {
        let signature_url: string | null = null;
        if (step.approver?.signature_encrypted) {
          signature_url = `/api/users/${step.approver.id}/signature`;
        }
        return {
          ...step,
          approver: step.approver
            ? {
                ...step.approver,
                signature_url,
              }
            : null,
        };
      });
      workflow = { ...workflow, steps: stepsWithSig };
    }

    const approvers = doc.workflow?.steps
      ? doc.workflow.steps
          .map((st: any) =>
            st.approver
              ? `${st.approver.first_name} ${st.approver.last_name}`
              : null,
          )
          .filter((name: any): name is string => Boolean(name))
      : [];

    return {
      id: doc.doc_number || doc.id,
      real_id: doc.id,
      folder_id: doc.folder_id,
      title: doc.title,
      name: doc.title,
      type: doc.type?.prefix || 'PR',
      doc_type: doc.type?.type_name || 'ใบขอซื้อ',
      creator_name: creatorName,
      sender: creatorName,
      approvers,
      created_at: doc.created_at,
      approved_at: doc.approved_at,
      status: doc.status,
      amount,
      department: doc.creator?.department?.name || 'ไม่ระบุ',
      creator_id: doc.creator_id,
      creator: doc.creator
        ? {
            id: doc.creator.id,
            first_name: doc.creator.first_name,
            last_name: doc.creator.last_name,
            email: doc.creator.email,
            department: doc.creator.department?.name,
            position: doc.creator.position?.name,
            role: doc.creator.role?.name,
            signature_url: creatorSigUrl,
          }
        : null,
      pr_form: doc.pr_form
        ? {
            ...doc.pr_form,
            attachment_file_name: doc.versions?.[0]?.file_extension
              ? `document_v${doc.versions[0].version_number}.${doc.versions[0].file_extension}`
              : undefined,
          }
        : null,
      po_form: doc.po_form
        ? {
            ...doc.po_form,
            attachment_file_name: doc.versions?.[0]?.file_extension
              ? `document_v${doc.versions[0].version_number}.${doc.versions[0].file_extension}`
              : undefined,
          }
        : null,
      bk_form: doc.bk_form,
      versions: doc.versions?.map((v: any) => ({
        id: v.id,
        version_number: v.version_number,
        file_size: v.file_size,
        file_extension: v.file_extension,
        created_at: v.created_at,
        uploaded_by: v.uploaded_by
          ? `${v.uploaded_by.first_name} ${v.uploaded_by.last_name}`
          : 'ไม่ระบุ',
        download_url: `/api/documents/${doc.id}/download?v=${v.version_number}`,
      })),
      workflow,
    };
  }
}
