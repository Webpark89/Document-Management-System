import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Prisma, AuditAction, DocumentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import puppeteer from 'puppeteer-core';
import { EncryptionService } from '../common/encryption/encryption.service';
import {
  Actor,
  hasAny,
  jsonSnapshot,
  loadActor,
  lockEntity,
  permissions,
  requireDocumentAccess,
  requireDocumentOwner,
  requirePermission,
  safeUserSelect,
  visibleDocuments,
} from '../common/document-policy';

const documentInclude = {
  type: true,
  creator: { include: { department: true, position: true, role: true } },
  pr_form: { include: { items: true, department: true } },
  po_form: { include: { items: true } },
  bk_form: { include: { department: true } },
  versions: {
    include: { uploaded_by: { select: { first_name: true, last_name: true } } },
    orderBy: { version_number: 'desc' as const },
  },
  workflow: {
    include: {
      steps: {
        include: { approver: { include: { role: true } } },
        orderBy: { step_order: 'asc' as const },
      },
    },
  },
} satisfies Prisma.DocumentInclude;
type FullDocument = Prisma.DocumentGetPayload<{
  include: typeof documentInclude;
}>;
// Lists must not duplicate multi-megabyte signatures, PDF bytes or snapshots.
const documentListInclude = {
  ...documentInclude,
  creator: { select: safeUserSelect },
  versions: {
    select: {
      id: true,
      version_number: true,
      file_size: true,
      file_extension: true,
      created_at: true,
      updated_at: true,
      uploaded_by_id: true,
      remarks: true,
      uploaded_by: { select: { first_name: true, last_name: true } },
    },
    orderBy: { version_number: 'desc' as const },
  },
  workflow: {
    include: {
      steps: {
        include: { approver: { select: safeUserSelect } },
        orderBy: { step_order: 'asc' as const },
      },
    },
  },
} satisfies Prisma.DocumentInclude;
type ListDocument = Prisma.DocumentGetPayload<{
  include: typeof documentListInclude;
}>;
type ResponseDocument = FullDocument | ListDocument;
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
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async actor(user: Actor | string): Promise<Actor> {
    return typeof user === 'string' ? loadActor(this.prisma, user) : user;
  }

  async logAction(
    userId: string,
    action: AuditAction,
    targetId: string,
    ipAddress: string,
    docNumber?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        user_id: userId,
        action,
        module: 'Document',
        target_id: targetId,
        ip_address: ipAddress,
        details: {
          oldState: {},
          newState: {},
          extra: { doc_number: docNumber },
        },
      },
    });
  }

  async findAll(options: FindAllOptions) {
    if (!options.currentUserId)
      throw new ForbiddenException('กรุณาเข้าสู่ระบบ');
    const actor = await loadActor(this.prisma, options.currentUserId);
    requirePermission(actor, permissions.view);
    const page = Number(options.page ?? 1),
      take = Number(options.limit ?? 20);
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(take) ||
      take < 1 ||
      take > 1000
    )
      throw new BadRequestException('page/limit ไม่ถูกต้อง');
    if (
      options.status &&
      options.status !== 'All' &&
      !Object.values(DocumentStatus).includes(options.status as DocumentStatus)
    )
      throw new BadRequestException('สถานะไม่ถูกต้อง');
    const where: Prisma.DocumentWhereInput = {
      AND: [
        visibleDocuments(actor),
        ...(options.status && options.status !== 'All'
          ? [{ status: options.status as DocumentStatus }]
          : []),
        ...(options.type && options.type !== 'All'
          ? [
              {
                type: {
                  prefix: options.type === 'OTHER' ? 'DOC' : options.type,
                },
              },
            ]
          : []),
        ...(options.search
          ? [
              {
                OR: [
                  {
                    title: {
                      contains: options.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    doc_number: {
                      contains: options.search,
                      mode: 'insensitive' as const,
                    },
                  },
                  {
                    search_text: {
                      contains: options.search,
                      mode: 'insensitive' as const,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    };
    const [total, docs] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        include: documentListInclude,
        orderBy: { created_at: 'desc' },
        take,
        skip: (page - 1) * take,
      }),
    ]);
    const files = docs.length
      ? await this.prisma.$queryRaw<{ id: string; has_file: boolean }[]>`
          SELECT id, COALESCE(octet_length(file_data), 0) > 0 AS has_file
          FROM document_versions
          WHERE document_id IN (${Prisma.join(docs.map((doc) => doc.id))})
        `
      : [];
    const filePresence = new Map(files.map((file) => [file.id, file.has_file]));
    return {
      data: docs.map((d) => this.mapDocumentToResponse(d, actor, filePresence)),
      meta: { total, page, limit: take, totalPages: Math.ceil(total / take) },
    };
  }

  async getDocument(
    id: string,
    database: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const doc = await database.document.findFirst({
      where: { OR: [{ id }, { doc_number: id }], is_deleted: false },
      include: documentInclude,
    });
    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');
    return doc;
  }

  async findOne(id: string, user: Actor | string) {
    const actor = await this.actor(user),
      doc = await this.getDocument(id);
    requirePermission(actor, permissions.detail);
    requireDocumentAccess(doc, actor);
    return this.mapDocumentToResponse(doc, actor);
  }

  private async visibility(
    dto: CreateDocumentDto,
    actor: Actor,
    tx: Prisma.TransactionClient,
  ) {
    const value = dto.visibility ?? {
      type: 'CompanyWide',
      departments: [],
      users: [],
    };
    const departments = [...new Set(value.departments ?? [])],
      users = [...new Set(value.users ?? [])];
    if (value.type === 'Department' && !departments.length)
      throw new BadRequestException('กรุณาเลือกแผนกที่เข้าถึงเอกสาร');
    if (value.type === 'SpecificUsers' && !users.length)
      throw new BadRequestException('กรุณาเลือกผู้ใช้ที่เข้าถึงเอกสาร');
    if (
      departments.length &&
      (await tx.department.count({
        where: { id: { in: departments }, is_active: true },
      })) !== departments.length
    )
      throw new BadRequestException('แผนกที่เลือกไม่ถูกต้อง');
    if (
      users.length &&
      (await tx.user.count({
        where: { id: { in: users }, is_active: true, is_deleted: false },
      })) !== users.length
    )
      throw new BadRequestException('ผู้ใช้ที่เลือกไม่ถูกต้อง');
    return {
      visibility_type: value.type,
      visibility_departments: value.type === 'Department' ? departments : [],
      visibility_users:
        value.type === 'SpecificUsers'
          ? [...new Set([...users, actor.id])]
          : [],
    };
  }

  private items(dto: CreateDocumentDto, prefix: string) {
    let total = 0;
    const items = (dto.items ?? []).map((item) => {
      const price = new Prisma.Decimal(item.unit_price).mul(item.quantity);
      const vat = prefix === 'PO' ? (item.vat ?? 7) : 0;
      const gross = price
        .mul(new Prisma.Decimal(1).add(new Prisma.Decimal(vat).div(100)))
        .toDecimalPlaces(2);
      total += Number(gross);
      return {
        item_name: item.item_name.trim(),
        quantity: item.quantity,
        unit: item.unit ?? 'ชิ้น',
        unit_price: item.unit_price,
        total_price: gross,
        remark: item.remark,
        ...(prefix === 'PO' ? { vat } : {}),
      };
    });
    if ((prefix === 'PR' || prefix === 'PO') && !items.length)
      throw new BadRequestException(
        'กรุณาเพิ่มรายการสินค้าอย่างน้อยหนึ่งรายการ',
      );
    if (total > 99999999.99)
      throw new BadRequestException('ยอดรวมเกินขอบเขตที่ระบบรองรับ');
    return { items, total: Math.round(total * 100) / 100 };
  }

  private async runningNumber(
    tx: Prisma.TransactionClient,
    type: { id: string; prefix: string },
  ) {
    await lockEntity(tx, `number:${type.id}`);
    let running = await tx.runningNumber.findUnique({
      where: { document_type_id: type.id },
    });
    const now = new Date(),
      year = now.getFullYear();
    if (!running)
      running = await tx.runningNumber.create({
        data: {
          document_type_id: type.id,
          prefix: type.prefix,
          year_format: 'YYYY',
          last_reset_year: year,
        },
      });
    let config = { yearFormat: 'ce4', separator: '-', resetCycle: 'yearly' };
    try {
      if (running.year_format.startsWith('{'))
        config = { ...config, ...JSON.parse(running.year_format) };
      else if (running.year_format === 'YY') config.yearFormat = 'ce2';
    } catch {
      throw new BadRequestException('รูปแบบเลขเอกสารไม่ถูกต้อง');
    }
    if ((config as typeof config & { isActive?: boolean }).isActive === false)
      throw new BadRequestException('รูปแบบเลขเอกสารนี้ถูกปิดใช้งาน');
    const resetKey =
      config.resetCycle === 'never'
        ? 0
        : config.resetCycle === 'monthly'
          ? year * 100 + now.getMonth() + 1
          : year;
    const first = running.last_reset_year !== resetKey;
    let next = first ? 1 : running.current_number + 1;
    const formattedYear =
      config.yearFormat === 'none'
        ? ''
        : String(year + (config.yearFormat.startsWith('be') ? 543 : 0)).slice(
            config.yearFormat.endsWith('2') ? -2 : 0,
          );
    const separator = config.separator === 'none' ? '' : config.separator;
    const month =
      config.resetCycle === 'monthly'
        ? String(now.getMonth() + 1).padStart(2, '0')
        : '';
    const format = (n: number) =>
      [
        running.prefix,
        formattedYear,
        month,
        String(n).padStart(running.padding_length, '0'),
      ]
        .filter(Boolean)
        .join(separator);
    // Existing records may predate the current counter or format. Never reuse their numbers.
    while (
      await tx.document.findUnique({
        where: { doc_number: format(next) },
        select: { id: true },
      })
    )
      next++;
    await tx.runningNumber.update({
      where: { id: running.id },
      data: { current_number: next, last_reset_year: resetKey },
    });
    return format(next);
  }

  snapshotDocument(
    doc: FullDocument,
    description?: string,
    previous?: any,
  ): Prisma.InputJsonValue {
    const form = doc.pr_form ?? doc.po_form ?? doc.bk_form ?? {};
    let company = {
      companyName: 'บริษัท นิสซุย (ประเทศไทย) จำกัด',
      companyAddress: '',
    };
    try {
      company = {
        ...company,
        ...JSON.parse(
          fs.readFileSync(
            path.join(process.cwd(), 'uploads/settings.json'),
            'utf8',
          ),
        ),
      };
    } catch {
      /* Defaults apply before settings are saved. */
    }
    const signer = (user: any) =>
      user
        ? {
            id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            department: user.department,
            position: user.position,
            role: { id: user.role?.id, name: user.role?.name },
            signature_encrypted: user.signature_encrypted,
          }
        : null;
    const workflow = doc.workflow
      ? {
          ...doc.workflow,
          steps: doc.workflow.steps.map((step) => {
            const signed = previous?._meta?.workflow?.steps?.find(
              (old: { id: string; status: string }) =>
                old.id === step.id && old.status === 'Approved',
            );
            return {
              ...step,
              approver:
                step.status === 'Approved' && signed
                  ? signed.approver
                  : signer(step.approver),
            };
          }),
        }
      : null;
    return jsonSnapshot({
      ...form,
      _meta: {
        id: doc.id,
        doc_number: doc.doc_number,
        title: doc.title,
        type: doc.type,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        approved_at: doc.approved_at,
        status: doc.status,
        creator_id: doc.creator_id,
        creator:
          doc.status !== 'Draft' && previous?._meta?.creator
            ? previous._meta.creator
            : signer(doc.creator),
        workflow,
        description:
          description ?? previous?._meta?.description ?? doc.search_text ?? '',
        company:
          doc.status !== 'Draft' && previous?._meta?.company
            ? previous._meta.company
            : company,
        visibility: {
          type: doc.visibility_type,
          departments: doc.visibility_departments,
          users: doc.visibility_users,
        },
        workflow_history: previous?._meta?.workflow_history ?? [],
        annotations: previous?._meta?.annotations ?? [],
      },
    });
  }

  async preserveLegacyVersion(tx: Prisma.TransactionClient, doc: FullDocument) {
    const latest = doc.versions[0];
    if (!latest || (latest.form_data as any)?._meta) return;
    const metadata = (
      this.snapshotDocument(doc, undefined, latest.form_data) as any
    )._meta;
    metadata.legacy_snapshot = true;
    if (metadata.creator) metadata.creator.signature_encrypted = null;
    for (const step of metadata.workflow?.steps ?? []) {
      if (step.approver) step.approver.signature_encrypted = null;
    }
    const legacy =
      latest.form_data &&
      typeof latest.form_data === 'object' &&
      !Array.isArray(latest.form_data)
        ? latest.form_data
        : (doc.pr_form ?? doc.po_form ?? doc.bk_form ?? {});
    const snapshot = jsonSnapshot({ ...legacy, _meta: metadata });
    const bytes = latest.file_data?.length
      ? Buffer.from(latest.file_data)
      : await this.generateFallbackPdf(doc, { ...latest, form_data: snapshot });
    await tx.documentVersion.update({
      where: { id: latest.id },
      data: {
        form_data: snapshot,
        file_data: bytes,
        file_size: String(bytes.length),
        file_extension: 'pdf',
      },
    });
    latest.form_data = snapshot as Prisma.JsonValue;
    latest.file_data = bytes;
  }

  async appendVersion(
    tx: Prisma.TransactionClient,
    doc: FullDocument,
    userId: string,
    remarks: string,
    buffer?: Buffer,
    description?: string,
    previous?: any,
  ) {
    const latest = await tx.documentVersion.findFirst({
      where: { document_id: doc.id },
      orderBy: { version_number: 'desc' },
    });
    const snapshot = this.snapshotDocument(
      doc,
      description,
      previous ?? latest?.form_data,
    );
    const bytes =
      buffer ?? (await this.generateFallbackPdf(doc, { form_data: snapshot }));
    return tx.documentVersion.create({
      data: {
        document_id: doc.id,
        version_number: (latest?.version_number ?? 0) + 1,
        uploaded_by_id: userId,
        remarks,
        form_data: snapshot,
        file_data: bytes,
        file_size: String(bytes.length),
        file_extension: 'pdf',
      },
    });
  }

  async create(
    dto: CreateDocumentDto,
    creatorId: string,
    file?: Express.Multer.File,
  ) {
    if (!dto.title?.trim())
      throw new BadRequestException('กรุณาระบุชื่อเอกสาร');
    const actor = await loadActor(this.prisma, creatorId);
    requirePermission(actor, permissions.create);
    if (!actor.department_id)
      throw new BadRequestException('ผู้ใช้ยังไม่ได้กำหนดแผนก');
    const prefix =
      dto.prefix === 'MEMO'
        ? 'BK'
        : dto.prefix === 'OTHER'
          ? 'DOC'
          : dto.prefix.toUpperCase();
    const data = this.items(dto, prefix);
    if (!['PR', 'PO', 'BK'].includes(prefix) && !file)
      throw new BadRequestException('กรุณาแนบไฟล์ PDF');
    if (prefix === 'PO' && !dto.vendor_name?.trim())
      throw new BadRequestException('กรุณาระบุผู้ขาย');
    return this.prisma.$transaction(
      async (tx) => {
        if (dto.client_request_id) {
          await lockEntity(tx, `create-request:${dto.client_request_id}`);
          const existing = await tx.document.findUnique({
            where: { id: dto.client_request_id },
            select: {
              id: true,
              creator_id: true,
              is_deleted: true,
              type: { select: { prefix: true } },
            },
          });
          if (existing) {
            if (
              existing.creator_id !== creatorId ||
              existing.is_deleted ||
              existing.type.prefix !== prefix
            )
              throw new ConflictException(
                'คำขอบันทึกนี้ถูกใช้กับเอกสารอื่นแล้ว กรุณาเปิดฟอร์มใหม่',
              );
            return this.mapDocumentToResponse(
              await this.getDocument(existing.id, tx),
              actor,
            );
          }
        }
        const type = await tx.documentType.findFirst({
          where: { prefix, is_active: true },
        });
        if (!type)
          throw new BadRequestException('ประเภทเอกสารถูกปิดใช้งานหรือไม่พบ');
        const docNumber = await this.runningNumber(tx, type);
        const doc = await tx.document.create({
          data: {
            ...(dto.client_request_id ? { id: dto.client_request_id } : {}),
            doc_number: docNumber,
            title: dto.title.trim(),
            type_id: type.id,
            creator_id: creatorId,
            status: 'Draft',
            search_text: dto.purpose ?? '',
            ...(await this.visibility(dto, actor, tx)),
            ...(prefix === 'PR'
              ? {
                  pr_form: {
                    create: {
                      requester_id: creatorId,
                      department_id: actor.department_id!,
                      purpose: dto.purpose,
                      remark: dto.remark,
                      requested_date: dto.requested_date
                        ? new Date(dto.requested_date)
                        : new Date(),
                      required_date: dto.required_date
                        ? new Date(dto.required_date)
                        : null,
                      total_amount: data.total,
                      items: { create: data.items },
                    },
                  },
                }
              : {}),
            ...(prefix === 'PO'
              ? {
                  po_form: {
                    create: {
                      vendor_name: dto.vendor_name!,
                      vendor_contact: dto.vendor_contact,
                      delivery_date: dto.delivery_date
                        ? new Date(dto.delivery_date)
                        : null,
                      payment_terms: dto.payment_terms,
                      remark: dto.remark,
                      total_amount: data.total,
                      items: { create: data.items },
                    },
                  },
                }
              : {}),
            ...(prefix === 'BK'
              ? {
                  bk_form: {
                    create: {
                      subject: dto.title,
                      detail: dto.purpose,
                      department_id: actor.department_id!,
                    },
                  },
                }
              : {}),
          },
          include: documentInclude,
        });
        await this.appendVersion(
          tx,
          doc,
          actor.id,
          'สร้างเอกสาร (ร่าง)',
          file?.buffer,
          dto.purpose,
        );
        await tx.auditLog.create({
          data: {
            user_id: actor.id,
            action: 'Upload',
            module: 'Document',
            target_id: doc.id,
            details: {
              oldState: {},
              newState: { status: 'Draft', doc_number: doc.doc_number },
              extra: {},
            },
          },
        });
        return this.mapDocumentToResponse(
          await this.getDocument(doc.id, tx),
          actor,
        );
      },
      { timeout: 60000, maxWait: 30000 },
    );
  }

  async createWithFile(
    dto: CreateDocumentDto,
    creatorId: string,
    file: Express.Multer.File,
  ) {
    return this.create(dto, creatorId, file);
  }

  async updateDocumentFull(
    id: string,
    dto: CreateDocumentDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    const actor = await loadActor(this.prisma, userId);
    requirePermission(actor, permissions.edit);
    const original = await this.getDocument(id);
    return this.prisma.$transaction(
      async (tx) => {
        await lockEntity(tx, `document:${original.id}`);
        const doc = await this.getDocument(original.id, tx);
        requireDocumentOwner(doc, actor);
        if (!['Draft', 'Returned'].includes(doc.status))
          throw new ConflictException(
            'แก้ไขได้เฉพาะร่างหรือเอกสารที่ส่งกลับแก้ไข',
          );
        const prefix = doc.type.prefix,
          data = this.items(dto, prefix);
        if (
          (dto.prefix === 'MEMO'
            ? 'BK'
            : dto.prefix === 'OTHER'
              ? 'DOC'
              : dto.prefix.toUpperCase()) !== prefix
        )
          throw new BadRequestException('ไม่สามารถเปลี่ยนประเภทเอกสารเดิม');
        if (!doc.type.is_active)
          throw new BadRequestException('ประเภทเอกสารถูกปิดใช้งาน');
        await this.preserveLegacyVersion(tx, doc);
        const update: Prisma.DocumentUncheckedUpdateInput = {
          title: dto.title.trim(),
          search_text: dto.purpose ?? '',
          status: 'Draft',
          approved_at: null,
        };
        if (dto.visibility)
          Object.assign(update, await this.visibility(dto, actor, tx));
        await tx.document.update({ where: { id: doc.id }, data: update });
        if (doc.pr_form)
          await tx.pRForm.update({
            where: { id: doc.pr_form.id },
            data: {
              purpose: dto.purpose,
              remark: dto.remark,
              requested_date: dto.requested_date
                ? new Date(dto.requested_date)
                : doc.pr_form.requested_date,
              required_date: dto.required_date
                ? new Date(dto.required_date)
                : null,
              total_amount: data.total,
              items: { deleteMany: {}, create: data.items },
            },
          });
        if (doc.po_form)
          await tx.pOForm.update({
            where: { id: doc.po_form.id },
            data: {
              vendor_name: dto.vendor_name ?? doc.po_form.vendor_name,
              vendor_contact: dto.vendor_contact,
              delivery_date: dto.delivery_date
                ? new Date(dto.delivery_date)
                : null,
              payment_terms: dto.payment_terms,
              remark: dto.remark,
              total_amount: data.total,
              items: { deleteMany: {}, create: data.items },
            },
          });
        if (doc.bk_form)
          await tx.bKForm.update({
            where: { id: doc.bk_form.id },
            data: { subject: dto.title, detail: dto.purpose },
          });
        const updated = await this.getDocument(doc.id, tx);
        // An uploaded PDF can be reused only for DOC; generated forms always render the new snapshot.
        const buffer =
          file?.buffer ??
          (!['PR', 'PO', 'BK'].includes(prefix) && doc.versions[0]?.file_data
            ? Buffer.from(doc.versions[0].file_data)
            : undefined);
        await this.appendVersion(
          tx,
          updated,
          actor.id,
          'แก้ไขเอกสาร (ร่าง)',
          buffer,
          dto.purpose,
        );
        await tx.auditLog.create({
          data: {
            user_id: actor.id,
            action: 'Edit',
            module: 'Document',
            target_id: doc.id,
            details: {
              oldState: { title: doc.title, status: doc.status },
              newState: { title: dto.title, status: 'Draft' },
              extra: {},
            },
          },
        });
        return this.mapDocumentToResponse(
          await this.getDocument(doc.id, tx),
          actor,
        );
      },
      { timeout: 60000, maxWait: 30000 },
    );
  }

  async updateDocumentFullWithFile(
    id: string,
    dto: CreateDocumentDto,
    userId: string,
    file: Express.Multer.File,
  ) {
    return this.updateDocumentFull(id, dto, userId, file);
  }

  async uploadNewVersion(
    id: string,
    userId: string,
    file: Express.Multer.File,
    title?: string,
    remarks?: string,
  ) {
    const actor = await loadActor(this.prisma, userId);
    requirePermission(actor, permissions.edit);
    const original = await this.getDocument(id);
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `document:${original.id}`);
      const doc = await this.getDocument(original.id, tx);
      requireDocumentOwner(doc, actor);
      if (!['Draft', 'Returned'].includes(doc.status))
        throw new ConflictException(
          'ต้องเป็นร่างหรือส่งกลับแก้ไขก่อนอัปโหลดฉบับใหม่',
        );
      if (['PR', 'PO', 'BK'].includes(doc.type.prefix))
        throw new BadRequestException(
          'กรุณาแก้ไขข้อมูลแบบฟอร์มเพื่อสร้างฉบับใหม่',
        );
      await this.preserveLegacyVersion(tx, doc);
      await tx.document.update({
        where: { id: doc.id },
        data: {
          title: title?.trim() || doc.title,
          status: 'Draft',
          approved_at: null,
        },
      });
      await this.appendVersion(
        tx,
        await this.getDocument(doc.id, tx),
        actor.id,
        remarks || 'อัปโหลดฉบับแก้ไข',
        file.buffer,
      );
      await tx.auditLog.create({
        data: {
          user_id: actor.id,
          action: 'Upload',
          module: 'Document',
          target_id: doc.id,
          details: {
            oldState: { status: doc.status },
            newState: { status: 'Draft' },
            extra: { version: (doc.versions[0]?.version_number ?? 0) + 1 },
          },
        },
      });
      return this.mapDocumentToResponse(
        await this.getDocument(doc.id, tx),
        actor,
      );
    });
  }

  async cancel(id: string, actor: Actor, reason: string) {
    requirePermission(actor, [
      ...permissions.delete,
      'submissions.cancel_document:delete',
      'document.recall_document:edit',
    ]);
    const original = await this.getDocument(id);
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `document:${original.id}`);
      const doc = await this.getDocument(original.id, tx);
      requireDocumentOwner(doc, actor);
      if (!['Draft', 'Pending', 'Returned'].includes(doc.status))
        throw new ConflictException('ไม่สามารถยกเลิกเอกสารที่สิ้นสุดแล้ว');
      await this.preserveLegacyVersion(tx, doc);
      if (doc.workflow)
        await tx.workflow.update({
          where: { id: doc.workflow.id },
          data: { status: 'Rejected' },
        });
      await tx.document.update({
        where: { id: doc.id },
        data: { status: 'Cancelled' },
      });
      const current = await this.getDocument(doc.id, tx);
      const prior = doc.versions[0];
      await this.appendVersion(
        tx,
        current,
        actor.id,
        `ยกเลิกเอกสาร: ${reason}`,
        prior?.file_data ? Buffer.from(prior.file_data) : undefined,
      );
      await tx.notification.createMany({
        data: [
          ...new Set(
            (doc.workflow?.steps ?? [])
              .filter((s) => s.status === 'Pending' && s.approver_id)
              .map((s) => s.approver_id!),
          ),
        ].map((user_id) => ({
          user_id,
          document_id: doc.id,
          message: `เอกสาร ${doc.doc_number} ถูกยกเลิกโดยผู้สร้าง`,
        })),
      });
      await tx.auditLog.create({
        data: {
          user_id: actor.id,
          action: 'Edit',
          module: 'Document',
          target_id: doc.id,
          details: {
            oldState: { status: doc.status },
            newState: { status: 'Cancelled' },
            extra: { reason },
          },
        },
      });
      return { success: true };
    });
  }

  async softDelete(id: string, actor: Actor) {
    requirePermission(actor, permissions.delete);
    const original = await this.getDocument(id);
    return this.prisma.$transaction(async (tx) => {
      await lockEntity(tx, `document:${original.id}`);
      const doc = await this.getDocument(original.id, tx);
      requireDocumentOwner(doc, actor);
      if (doc.status === 'Pending' || doc.status === 'Approved')
        throw new ConflictException(
          'ต้องยกเลิกเอกสารก่อนลบ; เอกสารอนุมัติแล้วเก็บไว้เป็นหลักฐาน',
        );
      await tx.document.update({
        where: { id: doc.id },
        data: { is_deleted: true },
      });
      await tx.auditLog.create({
        data: {
          user_id: actor.id,
          action: 'Delete',
          module: 'Document',
          target_id: doc.id,
          details: {
            oldState: { is_deleted: false },
            newState: { is_deleted: true },
            extra: {},
          },
        },
      });
      return { success: true };
    });
  }

  async getLatestVersionDownloadUrl(id: string, user: Actor) {
    const doc = await this.findOne(id, user);
    return { url: `/api/documents/${doc.real_id}/download` };
  }

  async getFileBuffer(
    id: string,
    versionNumber?: number,
    user?: Actor,
    preview = false,
  ) {
    const doc = await this.getDocument(id);
    if (user) {
      requirePermission(
        user,
        preview ? permissions.preview : permissions.download,
      );
      requireDocumentAccess(doc, user);
    }
    if (
      user &&
      versionNumber !== undefined &&
      versionNumber !== doc.versions[0]?.version_number
    )
      requirePermission(user, permissions.history);
    const version =
      versionNumber === undefined
        ? doc.versions[0]
        : doc.versions.find((v) => v.version_number === versionNumber);
    if (
      !version ||
      (versionNumber !== undefined &&
        (!Number.isInteger(versionNumber) || versionNumber < 1))
    )
      throw new NotFoundException('ไม่พบเวอร์ชันเอกสาร');
    if (!version.file_data?.length) {
      throw new ConflictException(
        'เวอร์ชันนี้ไม่มีไฟล์ PDF ที่บันทึกไว้ ไม่สามารถดาวน์โหลดหรือสร้างย้อนหลังแทนได้',
      );
    }
    const buffer = Buffer.from(version.file_data);
    return {
      buffer,
      filename: `${doc.doc_number}_v${version.version_number}.pdf`,
    };
  }

  async getVersionSignature(
    id: string,
    number: number,
    step: number,
    user: Actor,
  ) {
    const doc = await this.getDocument(id);
    requireDocumentAccess(doc, user);
    requirePermission(user, permissions.view);
    if (number !== doc.versions[0]?.version_number)
      requirePermission(user, permissions.history);
    const version = doc.versions.find((v) => v.version_number === number);
    const meta = (version?.form_data as any)?._meta;
    const signer =
      step === 0
        ? meta?.creator
        : meta?.workflow?.steps?.find(
            (s: any) => s.step_order === step && s.status === 'Approved',
          )?.approver;
    const uri = this.decryptSignature(signer?.signature_encrypted);
    if (!uri) throw new NotFoundException('ไม่พบลายเซ็นในเวอร์ชันนี้');
    const match = uri.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
    if (!match) throw new NotFoundException('รูปแบบลายเซ็นไม่รองรับ');
    return { buffer: Buffer.from(match[2], 'base64'), mimeType: match[1] };
  }

  private decryptSignature(cipherText?: string | null): string | null {
    if (!cipherText) return null;
    try {
      return this.encryption.decrypt(cipherText);
    } catch {
      return null;
    }
  }

  private buildDocumentHtml(doc: any, version?: any): string {
    const snapshot = version?.form_data;
    const meta = snapshot?._meta;
    if (snapshot) {
      doc = { ...doc, ...(meta ?? {}) };
      const prefix = doc.type?.prefix;
      if (prefix === 'PR') doc.pr_form = snapshot;
      if (prefix === 'PO') doc.po_form = snapshot;
      if (prefix === 'BK') doc.bk_form = snapshot;
      if (!meta && version.version_number !== doc.versions?.[0]?.version_number)
        doc.workflow = null;
    }
    if (version && !meta) {
      doc = {
        ...doc,
        creator: doc.creator
          ? { ...doc.creator, signature_encrypted: null }
          : null,
        workflow: doc.workflow
          ? {
              ...doc.workflow,
              steps: doc.workflow.steps.map((step: any) => ({
                ...step,
                approver: step.approver
                  ? { ...step.approver, signature_encrypted: null }
                  : null,
              })),
            }
          : null,
      };
    }
    const legacyWarning =
      version && (!meta || meta.legacy_snapshot)
        ? '<div style="font-size:10px;color:#92400e;margin-bottom:8px;">เอกสารรุ่นเดิม: ไม่ได้บันทึกภาพลายเซ็นต้นฉบับของเวอร์ชันนี้</div>'
        : '';
    // Only text from trusted templates is markup; all stored user input is escaped.
    const escape = (value: any): any => {
      if (typeof value === 'string')
        return value.replace(
          /[&<>"']/g,
          (c) =>
            ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              '"': '&quot;',
              "'": '&#39;',
            })[c]!,
        );
      if (
        value instanceof Date ||
        value instanceof Prisma.Decimal ||
        value === null ||
        typeof value !== 'object'
      )
        return value;
      if (Array.isArray(value)) return value.map(escape);
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, escape(item)]),
      );
    };
    doc = escape(doc);
    version = escape(version);
    // 1. Company Settings
    let companyName = 'บริษัท นิสซุย (ประเทศไทย) จำกัด';
    let companyAddress =
      'เลขที่ 282 (หรือ 2086) ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพมหานคร 10240';
    try {
      const settingsPath = path.join(process.cwd(), 'uploads', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const s = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (s.companyName) companyName = s.companyName;
        if (s.companyAddress) companyAddress = s.companyAddress;
      }
    } catch {
      /* Company defaults apply if no saved settings exist. */
    }

    if (version?.form_data?._meta?.company) {
      companyName = version.form_data._meta.company.companyName;
      companyAddress = version.form_data._meta.company.companyAddress;
    }
    const rawPrefix =
      doc.type?.prefix ||
      (doc.doc_number || doc.id || '').split('-')[0] ||
      'DOC';
    const prefix = rawPrefix.toUpperCase();
    const docNumber = doc.doc_number || doc.id;
    const vFormData = version?.form_data || {};

    const rawDate = doc.created_at ? new Date(doc.created_at) : new Date();
    const thaiDay = rawDate.getDate();
    const thaiMonth = rawDate.getMonth() + 1;
    const thaiYear = rawDate.getFullYear() + 543;
    const docDate = `${thaiDay}/${thaiMonth}/${thaiYear}`;

    const requesterName = doc.creator
      ? `${doc.creator.first_name || ''} ${doc.creator.last_name || ''}`.trim() ||
        doc.creator.username ||
        'วิภา รักดี'
      : 'วิภา รักดี';
    const department =
      doc.creator?.department?.name ||
      doc.pr_form?.department?.name ||
      doc.bk_form?.department?.name ||
      'แผนกจัดซื้อ';
    const title = doc.title || '-';

    const isPO = prefix === 'PO';
    const isBK = prefix === 'BK' || prefix === 'MEMO';

    const primaryColor = isPO ? '#6b21a8' : '#1e40af';
    const primaryLight = isPO ? '#f3e8ff' : '#dbeafe';
    const primaryText = isPO ? '#581c87' : '#1e3a8a';
    const highlightBanner = isPO ? '#7e22ce' : '#1d4ed8';

    const titleTH = isPO
      ? 'ใบสั่งซื้อ/สั่งจ้าง'
      : isBK
        ? 'บันทึกข้อความ'
        : 'ใบขออนุมัติจัดซื้อ/จัดจ้าง';
    const titleEN = isPO
      ? 'PURCHASE ORDER'
      : isBK
        ? 'MEMORANDUM'
        : 'PURCHASE REQUEST';

    // Signatures resolution
    const creatorSig = this.decryptSignature(doc.creator?.signature_encrypted);
    const approvedSteps = (doc.workflow?.steps || []).filter(
      (s: any) => s.status === 'Approved',
    );

    const signatures = [
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
          ? `${s.approver.first_name || ''} ${s.approver.last_name || ''}`.trim() ||
            'ผู้อนุมัติ'
          : s.approver_name || 'ผู้อนุมัติ';
        const stepRole =
          s.approver?.role?.name || (idx === 0 ? 'Manager' : 'Executive');
        const sigImg = this.decryptSignature(s.approver?.signature_encrypted);
        signatures.push({
          role: stepRole,
          name: stepName,
          date: s.action_date
            ? new Date(s.action_date).toLocaleString('th-TH', {
                timeZone: 'Asia/Bangkok',
              })
            : '',
          isApproved: true,
          sigImage: sigImg,
        });
      });
    }

    if (isBK) {
      const detail = vFormData.detail ?? doc.bk_form?.detail ?? doc.title ?? '';
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
        ${legacyWarning}
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
        <div class="memo-content" style="white-space: pre-wrap; overflow-wrap: anywhere;">${detail}</div>
        <div class="signatures-area">
          ${signatures
            .map(
              (s) => `
            <div class="sig-col">
              <div class="sig-box">
                ${
                  s.sigImage
                    ? `<img src="${s.sigImage}" />`
                    : `

                `
                }
              </div>
              <div style="border-top: 1px dotted #94a3b8; padding-top: 4px; font-weight: bold;">( ${s.name} )</div>
              <div style="font-size: 11px; color: #475569;">${s.role}</div>
              <div style="font-size: 10px; color: #64748b;">${s.date || docDate}</div>
            </div>
          `,
            )
            .join('')}
        </div>
        ${(version?.form_data?._meta?.annotations ?? []).map((entry: any) => `<p style="font-size: 11px; white-space: pre-wrap;">${entry.text || ''} ${entry.date ? new Date(entry.date).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : ''}</p>`).join('')}
    </body>
      </html>
      `;
    }

    // PR / PO Data
    let items =
      vFormData.items ?? (isPO ? doc.po_form?.items : doc.pr_form?.items) ?? [];
    if (!Array.isArray(items) || items.length === 0) {
      items = [
        {
          item_name: 'Item Reference 1',
          remark: 'หมายเหตุ...',
          quantity: 1,
          unit: 'ชิ้น',
          unit_price: doc.pr_form?.total_amount || 0,
        },
      ];
    }

    let subTotal = 0;
    items.forEach((it: any) => {
      subTotal +=
        Number(it.quantity || 1) * Number(it.unit_price || it.unitPrice || 0);
    });
    if (
      subTotal === 0 &&
      (doc.pr_form?.total_amount || doc.po_form?.total_amount)
    ) {
      subTotal = Number(doc.pr_form?.total_amount || doc.po_form?.total_amount);
    }
    const vatAmount = isPO
      ? items.reduce(
          (sum: number, item: any) =>
            sum +
            (Number(item.quantity) *
              Number(item.unit_price) *
              Number(item.vat ?? 7)) /
              100,
          0,
        )
      : 0;
    const grandTotal = subTotal + vatAmount;

    const purpose = doc.pr_form?.purpose || vFormData.purpose || title;
    let requiredDate = 'ตามที่ระบุในรายการ';
    if (doc.pr_form?.required_date || vFormData.required_date) {
      const rd = new Date(
        doc.pr_form?.required_date || vFormData.required_date,
      );
      requiredDate = `${rd.getDate()} / ${rd.getMonth() + 1} / ${rd.getFullYear()}`;
    }

    const vendorName =
      vFormData.vendorName || doc.po_form?.vendor_name || 'ไม่ระบุ';
    const vendorContact =
      vFormData.vendorContact || doc.po_form?.vendor_contact || 'ไม่ระบุ';
    const remark =
      doc.pr_form?.remark ||
      doc.po_form?.remark ||
      vFormData.remark ||
      'เอกสารใบขอซื้อฉบับนี้ใช้สำหรับขออนุมัติภายในก่อนดำเนินการจัดซื้อ';

    const itemsRows = items
      .map(
        (item: any, idx: number) => `
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
    `,
      )
      .join('');

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
        ${legacyWarning}
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

      ${
        isPO
          ? `
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
      `
          : `
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
      `
      }

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
            <span>${isPO ? 'ภาษีมูลค่าเพิ่มตามรายการ' : 'ยังไม่คิดภาษีในใบขอซื้อ'}<br><small>${isPO ? 'VAT' : 'VAT not included'}</small></span>
            <span style="font-weight: bold;">${Number(vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="grand-total-row">
            <span>ยอดสุทธิ<br><small style="font-size: 8px;">Grand Total</small></span>
            <span style="font-size: 13px; font-weight: 900;">฿${Number(grandTotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div class="signatures-row">
        ${signatures
          .map(
            (s) => `
          <div class="sig-card">
            <div>
              ${s.isApproved ? `<div class="sig-badge">SIGNED & APPROVED</div>` : ''}
              <div class="sig-img-container">
                ${
                  s.sigImage
                    ? `<img src="${s.sigImage}" />`
                    : `

                `
                }
              </div>
            </div>
            <div>
              <div class="sig-divider"></div>
              <div class="sig-role">${s.role}</div>
              <div class="sig-name">${s.name}</div>
              <div class="sig-date">${s.date ? `วันที่ ${s.date}` : ''}</div>
            </div>
          </div>
        `,
          )
          .join('')}
      </div>
      ${(version?.form_data?._meta?.annotations ?? []).map((entry: any) => `<p style="font-size: 11px; white-space: pre-wrap;">${entry.text || ''} ${entry.date ? new Date(entry.date).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : ''}</p>`).join('')}
    </body>
    </html>
    `;
  }

  async generateFallbackPdf(doc: any, version?: any): Promise<Buffer> {
    const paths = [
      ...new Set(
        [
          ...(process.env.PDF_BROWSER_PATH
            ? [process.env.PDF_BROWSER_PATH]
            : []),
          '/usr/bin/chromium',
          '/usr/bin/google-chrome',
          'C:/Program Files/Google/Chrome/Application/chrome.exe',
          'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
        ].filter((candidate) => fs.existsSync(candidate)),
      ),
    ];
    const html = this.buildDocumentHtml(doc, version);
    for (
      let attempt = 0;
      paths.length && attempt < Math.max(2, paths.length);
      attempt++
    ) {
      let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined;
      try {
        browser = await puppeteer.launch({
          executablePath: paths[attempt % paths.length],
          headless: true,
          timeout: 10000,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
          ],
        });
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(false);
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          if (
            request.url().startsWith('data:') ||
            request.url() === 'about:blank'
          )
            void request.continue();
          else void request.abort();
        });
        await page.setContent(html, { waitUntil: 'load', timeout: 15000 });
        return Buffer.from(
          await page.pdf({
            format: 'A4',
            printBackground: true,
            timeout: 15000,
            margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
          }),
        );
      } catch (error) {
        console.warn(
          'PDF renderer attempt failed:',
          error instanceof Error ? error.message : 'Unknown renderer error',
        );
      } finally {
        await browser?.close().catch(() => undefined);
      }
    }
    throw new ServiceUnavailableException(
      'ไม่สามารถสร้าง PDF ได้ กรุณาตรวจสอบ Chromium/Edge ของ server',
    );
  }

  private cleanResponse(value: any): any {
    if (value === null || value === undefined || typeof value !== 'object')
      return value;
    if (value instanceof Date || value instanceof Prisma.Decimal) return value;
    if (Array.isArray(value))
      return value.map((entry) => this.cleanResponse(entry));
    const hidden = new Set([
      'password_hash',
      'reset_token',
      'reset_token_expiry',
      'signature_encrypted',
      'file_data',
    ]);
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !hidden.has(key))
        .map(([key, entry]) => [key, this.cleanResponse(entry)]),
    );
  }

  private mapDocumentToResponse(
    doc: ResponseDocument,
    actor?: Actor,
    filePresence?: ReadonlyMap<string, boolean>,
  ) {
    const latest = doc.versions?.[0];
    const formData = (
      version: ResponseDocument['versions'][number] | undefined,
    ) => (version && 'form_data' in version ? version.form_data : null);
    const hasFile = (
      version: ResponseDocument['versions'][number] | undefined,
    ) =>
      version
        ? (filePresence?.get(version.id) ??
          ('file_data' in version && !!version.file_data?.length))
        : false;
    const frozenUser = (user: any, number: number, step: number) =>
      user
        ? {
            ...this.cleanResponse(user),
            signature_url: user.signature_encrypted
              ? `/api/documents/${doc.id}/versions/${number}/signatures/${step}`
              : null,
          }
        : null;
    const freezeView = (data: any, number: number) => {
      const meta = data?._meta;
      if (!meta) return this.cleanResponse(data);
      return {
        ...this.cleanResponse(data),
        _meta: {
          ...this.cleanResponse(meta),
          creator: frozenUser(meta.creator, number, 0),
          workflow: meta.workflow
            ? {
                ...this.cleanResponse(meta.workflow),
                steps: (meta.workflow.steps ?? []).map((s: any) => ({
                  ...this.cleanResponse(s),
                  approver: frozenUser(s.approver, number, s.step_order),
                  signature_url:
                    s.status === 'Approved'
                      ? frozenUser(s.approver, number, s.step_order)
                          ?.signature_url
                      : null,
                })),
              }
            : null,
        },
      };
    };
    const meta = (formData(latest) as any)?._meta;
    const creator = meta?.creator
      ? frozenUser(meta.creator, latest.version_number, 0)
      : this.cleanResponse(doc.creator);
    const workflow = doc.workflow
      ? {
          ...this.cleanResponse(doc.workflow),
          steps: doc.workflow.steps.map((s) => {
            const stored = meta?.workflow?.steps?.find(
              (entry: any) => entry.id === s.id,
            );
            const user =
              stored && latest
                ? frozenUser(
                    stored.approver,
                    latest.version_number,
                    s.step_order,
                  )
                : this.cleanResponse(s.approver);
            return {
              ...this.cleanResponse(s),
              approver: user,
              signature_url:
                s.status === 'Approved' ? user?.signature_url : null,
            };
          }),
        }
      : null;
    const type = doc.type.prefix;
    const amount = doc.pr_form?.total_amount ?? doc.po_form?.total_amount;
    return {
      id: doc.doc_number,
      real_id: doc.id,
      doc_number: doc.doc_number,
      title: doc.title,
      name: doc.title,
      type,
      doc_type: doc.type.type_name,
      folder_id: doc.folder_id,
      status: doc.status,
      is_deleted: doc.is_deleted,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      approved_at: doc.approved_at,
      submittedDate: doc.workflow?.created_at ?? null,
      amount:
        amount !== undefined
          ? `฿${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '-',
      creator_id: doc.creator_id,
      creator,
      creator_name: `${doc.creator.first_name} ${doc.creator.last_name}`,
      sender: `${doc.creator.first_name} ${doc.creator.last_name}`,
      department: doc.creator.department?.name ?? '',
      _meta: latest
        ? freezeView(formData(latest), latest.version_number)?._meta
        : undefined,
      purpose: meta?.description ?? doc.search_text ?? '',
      visibility: {
        type: doc.visibility_type,
        departments: doc.visibility_departments,
        users: doc.visibility_users,
      },
      pr_form: this.cleanResponse(doc.pr_form),
      po_form: this.cleanResponse(doc.po_form),
      bk_form: this.cleanResponse(doc.bk_form),
      workflow,
      has_file: hasFile(latest),
      fileUrl: `/api/documents/${doc.id}/download`,
      approvers:
        doc.workflow?.steps.map((s) =>
          s.approver ? `${s.approver.first_name} ${s.approver.last_name}` : '',
        ) ?? [],
      versions: (actor && !hasAny(actor, permissions.history)
        ? doc.versions.slice(0, 1)
        : doc.versions
      ).map((v, i) => ({
        id: v.id,
        version_number: v.version_number,
        version: `v${v.version_number}`,
        file_size: v.file_size,
        file_size_kb: v.file_size?.endsWith('KB')
          ? parseFloat(v.file_size)
          : Number(v.file_size ?? 0) / 1024,
        file_extension: v.file_extension,
        has_file: hasFile(v),
        file_sha256: 'file_data' in v && v.file_data instanceof Uint8Array && v.file_data.length
          ? createHash('sha256').update(v.file_data).digest('hex')
          : null,
        form_data: freezeView(formData(v), v.version_number),
        created_at: v.created_at,
        updated_at: v.updated_at,
        uploaded_by: v.uploaded_by
          ? `${v.uploaded_by.first_name} ${v.uploaded_by.last_name}`
          : v.uploaded_by_id,
        remarks: v.remarks,
        is_active: i === 0,
        download_url: `/api/documents/${doc.id}/download?v=${v.version_number}`,
      })),
    };
  }
}
