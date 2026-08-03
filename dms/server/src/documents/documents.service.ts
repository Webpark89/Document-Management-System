import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../common/s3/s3.service';
import { CreateDocumentDto } from './dto/create-document.dto';

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
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

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

    // Clamp limit to prevent abuse (max 100 per page)
    const take = Math.min(Math.max(Number(limit), 1), 100);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    const where: any = { is_deleted: false };

    // Non-admin users see only their own documents
    if (currentUserRole !== 'Administrator' && currentUserId) {
      where.creator_id = currentUserId;
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
          workflow: { include: { steps: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
    ]);

    return {
      data: docs.map((d) => this.mapDocumentToResponse(d)),
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

    return this.mapDocumentToResponse(doc);
  }

  async create(dto: CreateDocumentDto, creatorId: string) {
    // Creator must exist — no auto-create
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
    });
    if (!creator || !creator.is_active) {
      throw new BadRequestException('ไม่พบข้อมูลผู้สร้างเอกสาร');
    }

    // Resolve Department
    const deptId =
      creator.department_id ||
      (() => {
        throw new BadRequestException('ผู้ใช้ยังไม่ได้กำหนดแผนก');
      })();

    // Resolve Document Type
    let prefix = (dto.prefix || 'PR').toUpperCase();
    if (prefix === 'MEMO') prefix = 'BK';

    const docType = await this.prisma.documentType.findFirst({
      where: { prefix },
    });
    if (!docType) {
      throw new BadRequestException(`ไม่พบประเภทเอกสาร prefix="${prefix}"`);
    }

    // Auto-generate doc_number with optimistic locking via transaction
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

    // Calculate Items
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

    // Build form data by type
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
        workflow: { include: { steps: true } },
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

  /**
   * สร้างเอกสาร + อัปโหลดไฟล์ PDF ขึ้น R2 พร้อมกัน
   * ใช้สำหรับ POST /documents/upload (multipart/form-data)
   */
  async createWithFile(
    dto: CreateDocumentDto,
    creatorId: string,
    file: Express.Multer.File,
    approverIds: string[] = [],
  ) {
    // สร้างเอกสารก่อน (ใช้ logic เดิม)
    const doc = await this.create(dto, creatorId);
    const s3Key = `documents/${doc.doc_number}/v1.pdf`;

    try {
      // อัปโหลดไฟล์ขึ้น R2 / Storage
      await this.s3.uploadFile(s3Key, file.buffer, 'application/pdf');

      // สร้าง DocumentVersion แรก
      const version = await this.prisma.documentVersion.create({
        data: {
          document_id: doc.real_id,
          version_number: 1,
          file_path: s3Key,
          file_size: String(file.size),
          file_extension: 'pdf',
          uploaded_by_id: creatorId,
          remarks: 'Initial upload',
        },
      });

      return { ...doc, version_number: version.version_number, file_path: s3Key };
    } catch (err) {
      // Rollback: ลบเอกสารที่เพิ่งสร้างเพื่อไม่ให้เป็น orphan record
      await this.prisma.document.delete({ where: { id: doc.real_id } }).catch(() => {});
      throw err;
    }
  }

  /**
   * คืน Signed URL ของ PDF เวอร์ชันล่าสุด (อายุ 1 ชั่วโมง)
   * ใช้สำหรับ GET /documents/:id/signed-url
   */
  async getLatestVersionSignedUrl(id: string): Promise<{ url: string; expires_in: number }> {
    const doc = await this.findOne(id);
    const versions: any[] = doc.versions || [];

    if (!versions.length) {
      throw new NotFoundException('เอกสารยังไม่มีไฟล์ PDF กรุณาอัปโหลดไฟล์ก่อน');
    }

    // หยิบ version ล่าสุด (version_number สูงสุด)
    const latest = versions.sort((a, b) => b.version_number - a.version_number)[0];

    const url = await this.s3.getSignedUrl(latest.file_path, 3600);
    return { url, expires_in: 3600 };
  }

  async getFileBuffer(key: string): Promise<Buffer> {
    return this.s3.downloadFile(key);
  }

  async softDelete(id: string, currentUser: { id: string; role: string }) {

    const doc = await this.prisma.document.findFirst({
      where: { OR: [{ id }, { doc_number: id }], is_deleted: false },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');

    // Only owner or Administrator can delete
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

  private mapDocumentToResponse(doc: any) {
    const creatorName = doc.creator
      ? `${doc.creator.first_name} ${doc.creator.last_name}`
      : 'ไม่ระบุ';

    const amount = doc.pr_form
      ? `฿${Number(doc.pr_form.total_amount).toLocaleString()}`
      : doc.po_form
        ? `฿${Number(doc.po_form.total_amount).toLocaleString()}`
        : '-';

    return {
      id: doc.doc_number || doc.id,
      real_id: doc.id,
      name: doc.title,
      title: doc.title,
      doc_number: doc.doc_number,
      type: doc.type?.prefix || 'PR',
      type_name: doc.type?.type_name || 'เอกสารทั่วไป',
      status: doc.status,
      sender: creatorName,
      creator_name: creatorName,
      department: doc.creator?.department?.name || 'แผนกทั่วไป',
      submittedDate: doc.created_at
        ? new Date(doc.created_at).toLocaleDateString('th-TH')
        : '',
      created_at: doc.created_at,
      amount,
      version: 'v1.0',
      pr_form: doc.pr_form,
      po_form: doc.po_form,
      bk_form: doc.bk_form,
      workflow: doc.workflow,
      versions: doc.versions,
    };
  }
}
