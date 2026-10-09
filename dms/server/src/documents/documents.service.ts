import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

import { Prisma, AuditAction } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import puppeteer from 'puppeteer-core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

export interface DocumentResponsePayload {
  id: string;
  real_id?: string;
  doc_number?: string | null;
  folder_id?: string | null;
  title: string;
  type?: { prefix: string; type_name: string } | null;
  created_at: Date;
  approved_at?: Date | null;
  status: string;
  creator_id: string;
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    signature_encrypted?: string | null;
    department?: { name: string } | null;
    position?: { name: string } | null;
    role?: { name: string } | null;
  } | null;
  pr_form?:
    | any
    | {
        total_amount: number | string;
        [key: string]: unknown;
      }
    | null;
  po_form?:
    | any
    | {
        total_amount: number | string;
        [key: string]: unknown;
      }
    | null;
  bk_form?: unknown;
  versions?:
    | {
        id: string;
        version_number: number;
        file_size?: string | null;
        file_extension?: string | null;
        created_at: Date;
        uploaded_by?: {
          first_name: string;
          last_name: string;
        } | null;
        remarks?: string | null;
      }[]
    | null;
  workflow?: {
    steps?:
      | {
          approver?: {
            id: string;
            first_name: string;
            last_name: string;
            signature_encrypted?: string | null;
          } | null;
          [key: string]: unknown;
        }[]
      | null;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export interface FindAllOptions {
  status?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
  currentUserId?: string;
  currentUserRole?: string;
  permissions?: string[];
}

@Injectable()
export class DocumentsService {

  private processVisibility(visibility: any, creatorId: string, workflowSteps: any[]) {
    let visibilityType = 'CompanyWide';
    let visibilityDepts: string[] = [];
    let visibilityUsers: string[] = [];

    if (visibility) {
      if (typeof visibility === 'string') {
        try { visibility = JSON.parse(visibility); } catch (e) {}
      }
      visibilityType = visibility.type || 'CompanyWide';
      visibilityDepts = visibility.departments || [];
      visibilityUsers = visibility.users || [];
    }

    if (visibilityType !== 'CompanyWide') {
      visibilityUsers.push(creatorId);
      if (workflowSteps) {
        for (const step of workflowSteps) {
          let stepData = step;
          if (typeof step === 'string') {
            try { stepData = JSON.parse(step); } catch (e) {}
          }
          if (stepData && stepData.approver_id) {
            visibilityUsers.push(stepData.approver_id);
          }
        }
      }
      visibilityUsers = [...new Set(visibilityUsers)];
    }

    return { visibility_type: visibilityType, visibility_departments: visibilityDepts, visibility_users: visibilityUsers };
  }

  constructor(private prisma: PrismaService) {}

  logAction(
    userId: string,
    action: AuditAction,
    targetId: string,
    ipAddress: string,
    docNumber?: string,
  ) {
    // Fire and forget audit log
    this.prisma.auditLog
      .create({
        data: {
          user_id: userId,
          action,
          module: 'Document',
          target_id: targetId,
          ip_address: ipAddress,
          details: {
            extra: {
              comment: `User ${action.toLowerCase()}ed document`,
              doc_number: docNumber,
            },
          },
        },
      })
      .catch((e) => console.error('AuditLog error:', e));
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
      permissions = [],
    } = options;

    const take = Math.min(Math.max(Number(limit), 1), 1000);
    const skip = (Math.max(Number(page), 1) - 1) * take;

    const where: Prisma.DocumentWhereInput = { is_deleted: false };

    const canViewAll = permissions.includes('submissions.view_all:view') || permissions.includes('document.view_all:view');

    if (!canViewAll && currentUserId) {
      const userObj = await this.prisma.user.findUnique({ where: { id: currentUserId } });
      const deptId = userObj?.department_id;
      
      const visibilityConditions: any[] = [
        { creator_id: currentUserId }, // Creator can always see their own doc
        { visibility_type: 'CompanyWide' },
        { visibility_users: { has: currentUserId } }
      ];
      if (deptId) {
        visibilityConditions.push({ visibility_departments: { has: deptId } });
      }
      
      where.AND = [
        { OR: visibilityConditions }
      ];
    }

    if (status && status !== 'All') {
      where.status = status as any;
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
          type: { select: { id: true, prefix: true, type_name: true } },
          creator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              department: { select: { id: true, name: true } },
              position: { select: { id: true, name: true } },
              role: { select: { id: true, name: true } },
            },
          },
          pr_form: { select: { id: true, total_amount: true, purpose: true, remark: true } },
          po_form: { select: { id: true, total_amount: true, remark: true } },
          bk_form: { select: { id: true, subject: true, detail: true } },
          versions: {
            select: {
              id: true,
              document_id: true,
              version_number: true,
              file_size: true,
              file_extension: true,
              uploaded_by_id: true,
              remarks: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: { version_number: 'desc' },
            take: 1,
          },
          workflow: {
            select: {
              id: true,
              current_step: true,
              total_steps: true,
              status: true,
              steps: {
                select: {
                  id: true,
                  step_order: true,
                  status: true,
                  approver: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                    },
                  },
                },
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
      data: docs.map((d) => this.mapDocumentToResponse(d)),
      meta: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async findOne(id: string, user?: { id: string; role: string; department_id?: string }) {
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
        versions: { select: {
              id: true, document_id: true, version_number: true, file_size: true, file_extension: true, form_data: true, uploaded_by_id: true, remarks: true, created_at: true, updated_at: true,
              uploaded_by: true
            }, orderBy: { version_number: 'desc' } },
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

    if (doc && user && user.role !== 'Administrator') {
      const isCreator = doc.creator_id === user.id;
      const isVisibleType = doc.visibility_type === 'CompanyWide';
      const isVisibleDept = doc.visibility_departments && user.department_id && doc.visibility_departments.includes(user.department_id);
      const isVisibleUser = doc.visibility_users && doc.visibility_users.includes(user.id);
      
      if (!isCreator && !isVisibleType && !isVisibleDept && !isVisibleUser) {
        throw new ForbiddenException('คุณไม่มีสิทธิ์เข้าถึงเอกสารนี้');
      }
    }
    return this.mapDocumentToResponse(doc);
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
      const vatRate = item.vat !== undefined ? Number(item.vat) : ((prefix === 'PO' || prefix === 'PO_FORM') ? 7 : 0);
      totalAmount += itemTotal * (1 + (vatRate / 100));
      return {
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit || 'ชิ้น',
        unit_price: item.unit_price,
        total_price: itemTotal,
        remark: item.remark,
      };
    });

    const docData: Prisma.DocumentUncheckedCreateInput = {
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
          remark: dto.remark || '',
          total_amount: totalAmount,
          requested_date: new Date(),
          items: { create: itemsData },
        },
      };
    } else if (prefix === 'PO') {
        docData.po_form = {
          create: {
            vendor_name: dto.vendor_name || dto.purpose || 'Vendor',
            vendor_contact: dto.vendor_contact || '',
            delivery_date: dto.delivery_date ? new Date(dto.delivery_date) : null,
            payment_terms: dto.payment_terms || '',
            total_amount: totalAmount,
            remark: dto.remark || '',
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
        pr_form: { include: { items: true, department: true } },
        po_form: { include: { items: true } },
        bk_form: { include: { department: true } },
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

    let formDataToKeep: any = undefined;
    if (createdDoc.pr_form) formDataToKeep = createdDoc.pr_form;
    else if (createdDoc.po_form) formDataToKeep = createdDoc.po_form;
    else if (createdDoc.bk_form) formDataToKeep = createdDoc.bk_form;

    await this.prisma.documentVersion.create({
      data: {
        document_id: createdDoc.id,
        version_number: 1,
        uploaded_by_id: creatorId,
        remarks: 'สร้างเอกสาร (ร่าง)',
        form_data: formDataToKeep,
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
    approverIds: string[] = [], // eslint-disable-line @typescript-eslint/no-unused-vars
  ) {
    const doc = await this.create(dto, creatorId);

    try {
      const fileSizeKb = `${(file.size / 1024).toFixed(1)} KB`;
      // Update version 1 with the uploaded PDF buffer
      await this.prisma.documentVersion.updateMany({
        where: {
          document_id: doc.real_id,
          version_number: 1,
        },
        data: {
          file_data: file.buffer,
          file_size: fileSizeKb,
          file_extension: 'pdf',
          remarks: 'อัปโหลดไฟล์เอกสาร',
        },
      });

      return { ...doc, version_number: 1 };
    } catch (err) {
      await this.prisma.document
        .delete({ where: { id: doc.real_id } })
        .catch(() => {});
      throw err;
    }
  }

  async uploadNewVersion(
    id: string,
    userId: string,
    file: Express.Multer.File,
    title?: string,
    remarks?: string,
    userRole?: string,
  ) {
    const doc = await this.prisma.document.findFirst({
      where: {
        OR: [{ id }, { doc_number: id }],
        is_deleted: false,
      },
      include: {
        versions: {
          select: {
            id: true,
            document_id: true,
            version_number: true,
            file_size: true,
            file_extension: true,
            form_data: true,
            uploaded_by_id: true,
            remarks: true,
            created_at: true,
            updated_at: true,
            uploaded_by: true,
          },
          orderBy: { version_number: 'desc' },
          take: 1,
        },
      },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');
    if (doc.creator_id !== userId && userRole !== 'Administrator') {
      throw new ForbiddenException(
        'เฉพาะผู้สร้างเอกสารหรือผู้ดูแลระบบเท่านั้นที่สามารถอัปโหลดเวอร์ชันใหม่ได้',
      );
    }

    const nextVersion =
      doc.versions.length > 0 ? doc.versions[0].version_number + 1 : 2;

    const versionRemarks = remarks || 'อัปโหลดเวอร์ชันใหม่เพื่อแก้ไข';
    const fileSizeKb = `${(file.size / 1024).toFixed(1)} KB`;

    await this.prisma.documentVersion.create({
      data: {
        document_id: doc.id,
        version_number: nextVersion,
        file_data: file.buffer,
        file_size: fileSizeKb,
        file_extension: 'pdf',
        uploaded_by_id: userId,
        remarks: versionRemarks,
      },
    });

    const updatedDoc = await this.prisma.document.update({
      where: { id: doc.id },
      data: {
        ...(title ? { title } : {}),
      },
      include: {
        type: true,
        creator: true,
        pr_form: true,
        po_form: true,
        bk_form: true,
        versions: {
          select: {
            id: true,
            document_id: true,
            version_number: true,
            file_size: true,
            file_extension: true,
            form_data: true,
            uploaded_by_id: true,
            remarks: true,
            created_at: true,
            updated_at: true,
            uploaded_by: true,
          },
          orderBy: { version_number: 'desc' },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'Upload',
        module: 'Document',
        target_id: doc.id,
        details: {
          newState: {
            id: doc.id,
            version: nextVersion,
            remarks: versionRemarks,
          },
        },
      },
    });

    return this.mapDocumentToResponse(updatedDoc);
  }

  async getLatestVersionDownloadUrl(id: string): Promise<{ url: string }> {
    const doc = await this.findOne(id);
    return { url: `/api/documents/${doc.real_id || doc.id}/download` };
  }

  async getFileBuffer(
    documentId: string,
    versionNumber?: number,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        documentId,
      );

    const doc = await this.prisma.document.findFirst({
      where: {
        OR: isUuid
          ? [{ id: documentId }, { doc_number: documentId }]
          : [{ doc_number: documentId }],
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
        workflow: {
          include: {
            steps: {
              include: { approver: { include: { role: true } } },
              orderBy: { step_order: 'asc' },
            },
          },
        },
        versions: {
          orderBy: { version_number: 'desc' },
        },
      },
    });

    if (!doc) {
      throw new NotFoundException('ไม่พบเอกสาร');
    }

    let version = doc.versions[0];
    if (versionNumber) {
      const found = doc.versions.find(
        (v) => v.version_number === Number(versionNumber),
      );
      if (found) version = found;
    }

    const vNum = version?.version_number || 1;
    const filename = `${doc.doc_number || doc.id}_v${vNum}.pdf`;

    if (version && version.file_data && version.file_data.length > 0) {
      return { buffer: Buffer.from(version.file_data), filename };
    }

    const generatedBuffer = await this.generateFallbackPdf(doc, version);
    return { buffer: generatedBuffer, filename };
  }

  private decryptSignature(cipherText?: string | null): string | null {
    if (!cipherText) return null;
    try {
      const parts = cipherText.split(':');
      if (parts.length !== 3) return null;
      const [ivHex, authTagHex, encryptedHex] = parts;
      const rawKey = process.env.ENCRYPTION_KEY || 'default_secret_key_32bytes_len!!';
      const key = crypto.createHash('sha256').update(rawKey).digest();
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return null;
    }
  }

  private buildDocumentHtml(doc: any, version?: any): string {
    // 1. Company Settings
    let companyName = 'บริษัท ฮาฮา';
    let companyAddress = 'เลขที่ 282 (หรือ 2086) ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร 10240';
    try {
      const settingsPath = path.join(process.cwd(), 'uploads', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (s.companyName) companyName = s.companyName;
        if (s.companyAddress) companyAddress = s.companyAddress;
      }
    } catch {}

    const rawPrefix = doc.type?.prefix || (doc.doc_number || doc.id || '').split('-')[0] || 'DOC';
    const prefix = rawPrefix.toUpperCase();
    const docNumber = doc.doc_number || doc.id;
    const vFormData = version?.form_data || {};

    const rawDate = doc.created_at ? new Date(doc.created_at) : new Date();
    const thaiDay = rawDate.getDate();
    const thaiMonth = rawDate.getMonth() + 1;
    const thaiYear = rawDate.getFullYear() + 543;
    const docDate = `${thaiDay}/${thaiMonth}/${thaiYear}`;

    const requesterName = doc.creator
      ? `${doc.creator.first_name || ''} ${doc.creator.last_name || ''}`.trim() || doc.creator.username || 'วิภา รักดี'
      : 'วิภา รักดี';
    const department = doc.creator?.department?.name || doc.pr_form?.department?.name || doc.bk_form?.department?.name || 'แผนกจัดซื้อ';
    const title = doc.title || '-';

    const isPO = prefix === 'PO';
    const isBK = prefix === 'BK' || prefix === 'MEMO';

    const primaryColor = isPO ? '#6b21a8' : '#1e40af';
    const primaryLight = isPO ? '#f3e8ff' : '#dbeafe';
    const primaryText = isPO ? '#581c87' : '#1e3a8a';
    const highlightBanner = isPO ? '#7e22ce' : '#1d4ed8';

    const titleTH = isPO ? 'ใบสั่งซื้อ/สั่งจ้าง' : isBK ? 'บันทึกข้อความ' : 'ใบขออนุมัติจัดซื้อ/จัดจ้าง';
    const titleEN = isPO ? 'PURCHASE ORDER' : isBK ? 'MEMORANDUM' : 'PURCHASE REQUEST';

    // Signatures resolution
    const creatorSig = this.decryptSignature(doc.creator?.signature_encrypted);
    const approvedSteps = (doc.workflow?.steps || []).filter((s: any) => s.status === 'Approved');

    let signatures = [
      {
        role: 'ผู้จัดทำ (Prepared By)',
        name: requesterName,
        date: docDate,
        isApproved: false,
        sigImage: creatorSig,
      },
    ];

    if (approvedSteps.length > 0) {
      approvedSteps.forEach((s: any, idx: number) => {
        const stepName = s.approver
          ? `${s.approver.first_name || ''} ${s.approver.last_name || ''}`.trim() || 'ผู้อนุมัติ'
          : s.approver_name || 'ผู้อนุมัติ';
        const stepRole = s.approver?.role?.name || (idx === 0 ? 'Manager' : 'Executive');
        const sigImg = this.decryptSignature(s.approver?.signature_encrypted);
        signatures.push({
          role: stepRole,
          name: stepName,
          date: docDate,
          isApproved: true,
          sigImage: sigImg,
        });
      });
    } else if (doc.status === 'Approved' || doc.status === 'Pending') {
      signatures.push({
        role: 'Manager',
        name: requesterName,
        date: docDate,
        isApproved: true,
        sigImage: null,
      });
      signatures.push({
        role: 'Executive',
        name: 'ประเสริฐ มีสุข',
        date: docDate,
        isApproved: doc.status === 'Approved',
        sigImage: null,
      });
    }

    if (isBK) {
      const detail = doc.bk_form?.detail || vFormData.detail || doc.title || '';
      return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { font-family: 'Tahoma', 'Segoe UI', sans-serif; margin: 0; padding: 15mm 20mm; font-size: 14px; color: #0f172a; line-height: 1.6; }
          .memo-title { font-size: 26px; font-weight: 900; text-align: center; margin-bottom: 25px; }
          .memo-grid { display: grid; grid-template-columns: 90px 1fr 60px 1fr; margin-bottom: 12px; gap: 8px; }
          .label { font-weight: bold; font-size: 15px; }
          .dotted { border-bottom: 1px dotted #94a3b8; padding-bottom: 2px; }
          .full-row { display: grid; grid-template-columns: 60px 1fr; margin-bottom: 12px; gap: 8px; }
          .memo-content { margin-top: 25px; min-height: 350px; text-indent: 40px; line-height: 1.8; font-size: 14px; }
          .signatures-area { margin-top: 40px; display: flex; justify-content: flex-end; gap: 40px; }
          .sig-col { text-align: center; width: 180px; }
          .sig-box { height: 60px; display: flex; align-items: center; justify-content: center; }
          .sig-box img { max-height: 55px; max-width: 140px; }
        </style>
      </head>
      <body>
        <div class="memo-title">บันทึกข้อความ</div>
        <div class="memo-grid">
          <span class="label">ส่วนราชการ</span>
          <span class="dotted">${department || '-'}</span>
          <span class="label">วันที่</span>
          <span class="dotted">${docDate}</span>
        </div>
        <div class="full-row">
          <span class="label">ที่</span>
          <span class="dotted">${docNumber}</span>
        </div>
        <div class="full-row">
          <span class="label">เรื่อง</span>
          <span class="dotted" style="font-weight: bold;">${title || '-'}</span>
        </div>
        <div class="full-row" style="margin-bottom: 20px;">
          <span class="label">เรียน</span>
          <span class="dotted">ผู้บริหาร / ผู้เกี่ยวข้อง</span>
        </div>
        <div class="memo-content">${detail}</div>
        <div class="signatures-area">
          ${signatures.map(s => `
            <div class="sig-col">
              <div class="sig-box">
                ${s.sigImage ? `<img src="${s.sigImage}" />` : `
                  <svg width="100" height="35" viewBox="0 0 100 35">
                    <path d="M10 25 Q 30 5, 50 20 T 90 15" fill="none" stroke="#2563eb" stroke-width="2" />
                  </svg>
                `}
              </div>
              <div style="border-top: 1px dotted #94a3b8; padding-top: 4px; font-weight: bold;">( ${s.name} )</div>
              <div style="font-size: 11px; color: #475569;">${s.role}</div>
              <div style="font-size: 10px; color: #64748b;">${s.date || docDate}</div>
            </div>
          `).join('')}
        </div>
      </body>
      </html>
      `;
    }

    // PR / PO Data
    let items = (isPO ? doc.po_form?.items : doc.pr_form?.items) || vFormData.items || [];
    if (!Array.isArray(items) || items.length === 0) {
      items = [{ item_name: 'Item Reference 1', remark: 'หมายเหตุ...', quantity: 1, unit: 'ชิ้น', unit_price: doc.pr_form?.total_amount || 0 }];
    }

    let subTotal = 0;
    items.forEach((it: any) => {
      subTotal += Number(it.quantity || 1) * Number(it.unit_price || it.unitPrice || 0);
    });
    if (subTotal === 0 && (doc.pr_form?.total_amount || doc.po_form?.total_amount)) {
      subTotal = Number(doc.pr_form?.total_amount || doc.po_form?.total_amount);
    }
    const vatAmount = subTotal * 0.07;
    const grandTotal = subTotal + vatAmount;

    const purpose = doc.pr_form?.purpose || vFormData.purpose || title;
    let requiredDate = 'ตามที่ระบุในรายการ';
    if (doc.pr_form?.required_date || vFormData.required_date) {
      const rd = new Date(doc.pr_form?.required_date || vFormData.required_date);
      requiredDate = `${rd.getDate()} / ${rd.getMonth() + 1} / ${rd.getFullYear()}`;
    }

    const vendorName = vFormData.vendorName || doc.po_form?.vendor_name || 'ไม่ระบุ';
    const vendorContact = vFormData.vendorContact || doc.po_form?.vendor_contact || 'ไม่ระบุ';
    const remark = doc.pr_form?.remark || doc.po_form?.remark || vFormData.remark || 'เอกสารใบขอซื้อฉบับนี้ใช้สำหรับขออนุมัติภายในก่อนดำเนินการจัดซื้อ';

    const itemsRows = items.map((item: any, idx: number) => `
      <tr style="border-bottom: 1px solid #cbd5e1;">
        <td style="border-right: 1px solid #1e293b; padding: 6px 4px; text-align: center;">${idx + 1}</td>
        <td style="border-right: 1px solid #1e293b; padding: 6px 8px;">
          <div style="font-weight: bold; color: #0f172a;">${item.item_name || item.name || item.description}</div>
          ${item.remark ? `<div style="font-size: 10px; color: #64748b;">${item.remark}</div>` : ''}
        </td>
        <td style="border-right: 1px solid #1e293b; padding: 6px 4px; text-align: center;">${item.quantity}</td>
        <td style="border-right: 1px solid #1e293b; padding: 6px 4px; text-align: center;">${item.unit || 'ชิ้น'}</td>
        <td style="border-right: 1px solid #1e293b; padding: 6px 8px; text-align: right;">${Number(item.unit_price || item.unitPrice || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: bold;">${(Number(item.quantity || 1) * Number(item.unit_price || item.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @page { size: A4; margin: 0; }
        * { box-sizing: border-box; }
        body {
          font-family: 'Tahoma', 'Segoe UI', sans-serif;
          margin: 0;
          padding: 12mm;
          font-size: 11px;
          color: #1e293b;
          line-height: 1.4;
        }
        .header-block {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid ${primaryColor};
          padding-bottom: 12px;
          margin-bottom: 12px;
        }
        .company-info {
          max-width: 280px;
        }
        .company-name {
          font-size: 16px;
          font-weight: bold;
          color: ${primaryText};
        }
        .company-addr {
          font-size: 10px;
          color: #334155;
          margin-top: 4px;
          line-height: 1.35;
          white-space: pre-wrap;
        }
        .header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .title-box {
          border: 2px solid ${primaryColor};
          background: ${primaryLight};
          color: ${primaryText};
          width: 250px;
          text-align: center;
          padding: 6px 12px;
          margin-bottom: 6px;
        }
        .title-th {
          font-size: 16px;
          font-weight: 900;
          margin: 0;
        }
        .title-en {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
          margin: 2px 0 0 0;
          letter-spacing: 0.5px;
        }
        .meta-table {
          border-collapse: collapse;
          border: 1px solid #1e293b;
          width: 250px;
          font-size: 10px;
        }
        .meta-table th {
          border: 1px solid #1e293b;
          background: ${primaryLight};
          padding: 3px 6px;
          font-weight: bold;
          text-align: left;
          width: 35%;
        }
        .meta-table td {
          border: 1px solid #1e293b;
          padding: 3px 6px;
          text-align: center;
          font-weight: bold;
        }
        .two-boxes {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .info-box {
          flex: 1;
          border: 1px solid #1e293b;
          padding: 8px;
        }
        .box-title {
          font-weight: bold;
          color: ${primaryText};
          border-bottom: 1px solid #1e293b;
          padding-bottom: 4px;
          margin-bottom: 6px;
          font-size: 11px;
        }
        .info-row {
          display: grid;
          grid-template-columns: 85px 1fr;
          gap: 4px;
          margin-bottom: 3px;
          font-size: 10.5px;
        }
        .info-label {
          font-weight: bold;
          color: #475569;
        }
        .info-val {
          font-weight: bold;
          color: #0f172a;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #1e293b;
        }
        .items-table th {
          background: ${primaryLight};
          border-bottom: 2px solid #1e293b;
          color: ${primaryText};
          font-weight: bold;
          padding: 6px 4px;
          font-size: 10.5px;
          text-align: center;
        }
        .remarks-total-block {
          display: flex;
          border: 2px solid #1e293b;
          border-top: none;
          margin-bottom: 16px;
        }
        .remarks-side {
          flex: 1;
          padding: 8px 12px;
          border-right: 1px solid #1e293b;
        }
        .total-side {
          width: 250px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          font-size: 10.5px;
          border-bottom: 1px solid #e2e8f0;
        }
        .grand-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: ${highlightBanner};
          color: #ffffff;
          padding: 6px 8px;
          font-weight: bold;
        }
        .signatures-row {
          display: flex;
          gap: 12px;
        }
        .sig-card {
          flex: 1;
          border: 1px solid #1e293b;
          padding: 6px 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 105px;
        }
        .sig-badge {
          display: inline-block;
          border: 1px solid #10b981;
          color: #059669;
          font-weight: bold;
          font-size: 8.5px;
          padding: 1px 6px;
          border-radius: 4px;
          margin-bottom: 2px;
        }
        .sig-img-container {
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sig-img-container img {
          max-height: 42px;
          max-width: 130px;
        }
        .sig-divider {
          border-top: 1px solid #94a3b8;
          margin: 2px 8px 4px 8px;
        }
        .sig-role {
          font-weight: bold;
          font-size: 10.5px;
          color: #0f172a;
        }
        .sig-name {
          font-size: 10px;
          color: #2563eb;
          font-weight: bold;
        }
        .sig-date {
          font-size: 9px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="header-block">
        <div class="company-info">
          <div class="company-name">${companyName}</div>
          <div class="company-addr">${companyAddress}</div>
        </div>
        <div class="header-right">
          <div class="title-box">
            <h2 class="title-th">${titleTH}</h2>
            <p class="title-en">${titleEN}</p>
          </div>
          <table class="meta-table">
            <tr>
              <th>เลขที่ / No.</th>
              <td>${docNumber}</td>
            </tr>
            <tr>
              <th>วันที่ / Date</th>
              <td>${docDate}</td>
            </tr>
          </table>
        </div>
      </div>

      ${isPO ? `
        <div class="two-boxes">
          <div class="info-box">
            <div class="box-title">ผู้ขาย / Vendor</div>
            <div class="info-row"><span class="info-label">ชื่อร้าน/บริษัท:</span><span class="info-val">${vendorName}</span></div>
            <div class="info-row"><span class="info-label">ข้อมูลติดต่อ:</span><span class="info-val">${vendorContact}</span></div>
          </div>
          <div class="info-box">
            <div class="box-title">ผู้ซื้อ / Buyer</div>
            <div class="info-row"><span class="info-label">ชื่อ / Name:</span><span class="info-val">${requesterName}</span></div>
            <div class="info-row"><span class="info-label">แผนก / Dept:</span><span class="info-val">${department}</span></div>
            <div class="info-row"><span class="info-label">เรื่อง:</span><span class="info-val">${title}</span></div>
          </div>
        </div>
      ` : `
        <div class="two-boxes">
          <div class="info-box">
            <div class="box-title">ผู้เสนอขอจัดซื้อ / Requester</div>
            <div class="info-row"><span class="info-label">ชื่อ / Name:</span><span class="info-val">${requesterName}</span></div>
            <div class="info-row"><span class="info-label">แผนก / Dept:</span><span class="info-val">${department}</span></div>
            <div class="info-row"><span class="info-label">เรื่อง / โครงการ:</span><span class="info-val">${title}</span></div>
          </div>
          <div class="info-box">
            <div class="box-title">วัตถุประสงค์ / Purpose</div>
            <div class="info-row"><span class="info-label">วัตถุประสงค์:</span><span class="info-val">${purpose}</span></div>
            <div class="info-row"><span class="info-label">วันที่ต้องการ:</span><span class="info-val">${requiredDate}</span></div>
          </div>
        </div>
      `}

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 36px; border-right: 1px solid #1e293b;">No.</th>
            <th style="border-right: 1px solid #1e293b;">รายการสินค้า / บริการ</th>
            <th style="width: 55px; border-right: 1px solid #1e293b;">จำนวน</th>
            <th style="width: 55px; border-right: 1px solid #1e293b;">หน่วย</th>
            <th style="width: 85px; border-right: 1px solid #1e293b;">ราคา/หน่วย</th>
            <th style="width: 95px;">จำนวนเงิน</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="remarks-total-block">
        <div class="remarks-side">
          <div style="font-weight: bold; margin-bottom: 4px;">หมายเหตุ / Remarks:</div>
          <div style="color: #475569; font-size: 10px;">${remark}</div>
        </div>
        <div class="total-side">
          <div class="total-row">
            <span>ยอดรวม<br><small>Sub Total</small></span>
            <span style="font-weight: bold;">${Number(subTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="total-row">
            <span>ภาษีมูลค่าเพิ่ม 7%<br><small>VAT 7%</small></span>
            <span style="font-weight: bold;">${Number(vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="grand-total-row">
            <span>ยอดสุทธิ<br><small style="font-size: 8px;">Grand Total</small></span>
            <span style="font-size: 13px; font-weight: 900;">฿${Number(grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="signatures-row">
        ${signatures.map(s => `
          <div class="sig-card">
            <div>
              ${s.isApproved ? `<div class="sig-badge">SIGNED & APPROVED</div>` : ''}
              <div class="sig-img-container">
                ${s.sigImage ? `<img src="${s.sigImage}" />` : `
                  <svg width="100" height="35" viewBox="0 0 100 35">
                    <path d="M10 25 Q 30 5, 50 20 T 90 15" fill="none" stroke="#2563eb" stroke-width="2" />
                  </svg>
                `}
              </div>
            </div>
            <div>
              <div class="sig-divider"></div>
              <div class="sig-role">${s.role}</div>
              <div class="sig-name">${s.name}</div>
              <div class="sig-date">${s.date ? `วันที่ ${s.date}` : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
    `;
  }

  async generateFallbackPdf(doc: any, version?: any): Promise<Buffer> {
    // 1. High-fidelity PDF generation via Chromium/Edge (100% matches browser preview)
    try {
      const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      ];
      const executablePath = chromePaths.find((p) => fs.existsSync(p));

      if (executablePath) {
        const html = this.buildDocumentHtml(doc, version);
        const browser = await puppeteer.launch({
          executablePath,
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
        });
        try {
          const page = await browser.newPage();
          await page.setContent(html, { waitUntil: 'load' });
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
          });
          return Buffer.from(pdfBuffer);
        } finally {
          await browser.close();
        }
      }
    } catch (err) {
      console.warn('Chromium PDF rendering error, falling back to pdf-lib:', err);
    }

    // 2. Secondary fallback using pdf-lib
    const pdfDoc = await PDFDocument.create();
    let customFont: any = null;
    const fontPath = 'C:/Windows/Fonts/tahoma.ttf';
    try {
      if (fs.existsSync(fontPath)) {
        const fontBytes = fs.readFileSync(fontPath);
        pdfDoc.registerFontkit(fontkit);
        customFont = await pdfDoc.embedFont(fontBytes);
      }
    } catch (e) {
      console.warn('Could not load custom font, falling back to StandardFonts:', e);
    }
    const fallbackFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const font = customFont || fallbackFont;

    const safeText = (text: string | null | undefined): string => {
      if (!text) return '-';
      const str = String(text);
      if (customFont) return str;
      return str.replace(/[^\x20-\x7E]/g, ' ');
    };

    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    page.drawRectangle({
      x: 36,
      y: height - 55,
      width: width - 72,
      height: 35,
      color: rgb(0.08, 0.25, 0.55),
    });
    page.drawText(safeText('บริษัท ฮาฮา'), {
      x: 50,
      y: height - 42,
      size: 11,
      font,
      color: rgb(1, 1, 1),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }

  async updateDocumentFull(id: string, dto: CreateDocumentDto, userId: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        OR: [{ id }, { doc_number: id }],
        is_deleted: false,
      },
      include: { type: true, pr_form: true, po_form: true, bk_form: true },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');
    if (!['Returned', 'Rejected', 'Draft', 'Pending'].includes(doc.status)) {
      throw new BadRequestException('สถานะเอกสารไม่สามารถแก้ไขได้');
    }

    let prefix = (dto.prefix || doc.type?.prefix || 'PR').toUpperCase();
    if (prefix === 'MEMO') prefix = 'BK';

    let totalAmount = 0;
    const itemsData = (dto.items || []).map((item) => {
      const itemTotal =
        Number(item.quantity || 1) * Number(item.unit_price || 0);
      const vatRate = item.vat !== undefined ? Number(item.vat) : ((prefix === 'PO' || prefix === 'PO_FORM') ? 7 : 0);
      totalAmount += itemTotal * (1 + (vatRate / 100));
      return {
        item_name: item.item_name,
        quantity: item.quantity,
        unit: item.unit || 'ชิ้น',
        unit_price: item.unit_price,
        total_price: itemTotal,
        remark: item.remark,
      };
    });

    // Update main document
    await this.prisma.document.update({
      where: { id: doc.id },
      data: { title: dto.title, status: 'Draft' },
    });

    const targetPrefix = doc.type?.prefix || prefix;

    // Update forms
    if (targetPrefix === 'PR' && doc.pr_form) {
      await this.prisma.pRForm.update({
        where: { id: doc.pr_form.id },
        data: {
          purpose: dto.purpose || '',
          remark: dto.remark || '',
          total_amount: totalAmount,
          items: { deleteMany: {}, create: itemsData },
        },
      });
    } else if (targetPrefix === 'PO' && doc.po_form) {
      await this.prisma.pOForm.update({
        where: { id: doc.po_form.id },
        data: {
          vendor_name: dto.vendor_name || dto.purpose || 'Vendor',
          vendor_contact: dto.vendor_contact || '',
          delivery_date: dto.delivery_date ? new Date(dto.delivery_date) : null,
          payment_terms: dto.payment_terms || '',
          total_amount: totalAmount,
          remark: dto.remark || '',
          items: { deleteMany: {}, create: itemsData },
        },
      });
    } else if (
      (targetPrefix === 'BK' || targetPrefix === 'MEMO') &&
      doc.bk_form
    ) {
      await this.prisma.bKForm.update({
        where: { id: doc.bk_form.id },
        data: {
          subject: dto.title,
          detail: dto.purpose || '',
        },
      });
    }

    const updatedFullDoc = await this.findOne(doc.id);
    let updatedFormData: any = undefined;
    if (updatedFullDoc.pr_form) updatedFormData = updatedFullDoc.pr_form;
    else if (updatedFullDoc.po_form) updatedFormData = updatedFullDoc.po_form;
    else if (updatedFullDoc.bk_form) updatedFormData = updatedFullDoc.bk_form;

    if (updatedFormData) {
      const latestVersion = await this.prisma.documentVersion.findFirst({
        where: { document_id: doc.id },
        orderBy: { version_number: 'desc' },
      });
      if (latestVersion) {
        await this.prisma.documentVersion.update({
          where: { id: latestVersion.id },
          data: { form_data: updatedFormData },
        });
      }
    }

    await this.prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'Edit',
        module: 'Document',
        target_id: doc.id,
        details: { message: 'อัปเดตเอกสารเต็มรูปแบบเพื่อรอส่งใหม่' },
      },
    });

    return updatedFullDoc;
  }

  async updateDocumentFullWithFile(
    id: string,
    dto: CreateDocumentDto,
    userId: string,
    file: Express.Multer.File,
  ) {
    const updatedDoc = await this.updateDocumentFull(id, dto, userId);

    const doc = await this.prisma.document.findUnique({
      where: { id: updatedDoc.real_id || updatedDoc.id },
      include: { versions: { select: {
              id: true, document_id: true, version_number: true, file_size: true, file_extension: true, form_data: true, uploaded_by_id: true, remarks: true, created_at: true, updated_at: true,
              uploaded_by: true
            }, orderBy: { version_number: 'desc' }, take: 1 } },
    });
    if (!doc) throw new NotFoundException('Document not found');

    const nextVersion =
      doc.versions.length > 0 ? doc.versions[0].version_number + 1 : 2;

    await this.prisma.documentVersion.create({
      data: {
        document_id: doc.id,
        version_number: nextVersion,
        file_data: file.buffer,
        file_size: String(file.size),
        file_extension: 'pdf',
        uploaded_by_id: userId,
        remarks: 'อัปโหลดเวอร์ชันใหม่ผ่านการแก้ไขเต็มรูปแบบ',
      },
    });

    return this.findOne(doc.id);
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
          oldState: {
            id: doc.id,
            doc_number: doc.doc_number,
            is_deleted: false,
          },
          newState: {
            id: doc.id,
            doc_number: doc.doc_number,
            is_deleted: true,
          },
        },
      },
    });

    return { success: true, message: 'ลบเอกสารสำเร็จ' };
  }

  private mapDocumentToResponse(doc: DocumentResponsePayload) {
    const creatorName = doc.creator
      ? `${doc.creator.first_name} ${doc.creator.last_name}`
      : 'ไม่ระบุ';

    const amount = doc.pr_form
      ? `฿${Number(doc.pr_form.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : doc.po_form
        ? `฿${Number(doc.po_form.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '-';

    const creatorSigUrl = doc.creator?.signature_encrypted
      ? `/api/users/${doc.creator.id}/signature`
      : null;

    let workflow = doc.workflow;
    if (workflow && workflow.steps) {
      const stepsWithSig = workflow.steps.map(
        (
          step: NonNullable<
            NonNullable<DocumentResponsePayload['workflow']>['steps']
          >[0],
        ) => {
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
        },
      );
      workflow = { ...workflow, steps: stepsWithSig };
    }

    const approvers = doc.workflow?.steps
      ? doc.workflow.steps
          .map(
            (
              st: NonNullable<
                NonNullable<DocumentResponsePayload['workflow']>['steps']
              >[0],
            ) =>
              st.approver
                ? `${st.approver.first_name} ${st.approver.last_name}`
                : null,
          )
          .filter((name: unknown): name is string => Boolean(name))
      : [];

    return {
      id: doc.doc_number || doc.id,
      real_id: doc.id,
      folder_id: doc.folder_id,
      title: doc.title,
      name: doc.title,
      type: doc.type?.prefix || (doc.doc_number || doc.id || '').split('-')[0] || 'DOC',
      doc_type: doc.type?.type_name || ((doc.doc_number || doc.id || '').startsWith('PO') ? 'ใบสั่งซื้อ (PO)' : (doc.doc_number || doc.id || '').startsWith('BK') ? 'บันทึกข้อความ (BK)' : (doc.doc_number || doc.id || '').startsWith('PR') ? 'ใบขอซื้อ (PR)' : 'เอกสารทั่วไป (DOC)'),
      creator_name: creatorName,
      sender: creatorName,
      approvers,
      created_at: doc.created_at,
      submittedDate: doc.created_at ? new Date(doc.created_at).toISOString() : undefined,
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
      versions: doc.versions?.map(
        (v: NonNullable<DocumentResponsePayload['versions']>[0], index: number) => ({
          id: v.id,
          version_number: v.version_number,
          file_size: v.file_size,
          file_extension: v.file_extension,
          form_data: (v as any).form_data,
          created_at: v.created_at,
          uploaded_by: v.uploaded_by
            ? `${v.uploaded_by.first_name} ${v.uploaded_by.last_name}`
            : 'ไม่ระบุ',
          download_url: `/api/documents/${doc.id}/download?v=${v.version_number}`,
          remarks: v.remarks,
          is_active: index === 0,
        }),
      ),
      workflow,
    };
  }
}

