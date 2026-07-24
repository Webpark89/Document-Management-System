import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string, type?: string, search?: string) {
    const where: any = { is_deleted: false };

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

    const docs = await this.prisma.document.findMany({
      where,
      include: {
        type: true,
        creator: {
          include: { department: true },
        },
        pr_form: true,
        po_form: true,
        bk_form: true,
        workflow: {
          include: { steps: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return docs.map((d) => this.mapDocumentToResponse(d));
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        OR: [{ id }, { doc_number: id }],
        is_deleted: false,
      },
      include: {
        type: true,
        creator: {
          include: { department: true, position: true, role: true },
        },
        pr_form: {
          include: { items: true, department: true },
        },
        po_form: {
          include: { items: true },
        },
        bk_form: {
          include: { department: true },
        },
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

  async create(dto: CreateDocumentDto, creatorIdRaw?: string) {
    // 1. Resolve Creator User ID
    let creator = await this.prisma.user.findFirst({
      where: creatorIdRaw ? { OR: [{ id: creatorIdRaw }, { username: creatorIdRaw }] } : {},
    });

    if (!creator) {
      creator = await this.prisma.user.findFirst() || await this.prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@company.com',
          password_hash: '$2b$10$e.w...',
          first_name: 'Admin',
          last_name: 'System',
        },
      });
    }

    const creatorId = creator.id;

    // 2. Resolve Department ID
    let deptId = creator.department_id;
    if (!deptId) {
      const firstDept = await this.prisma.department.findFirst();
      if (firstDept) {
        deptId = firstDept.id;
      } else {
        const newDept = await this.prisma.department.create({ data: { name: 'แผนกทั่วไป' } });
        deptId = newDept.id;
      }
    }

    // 3. Resolve Document Type
    let prefix = (dto.prefix || 'PR').toUpperCase();
    if (prefix === 'MEMO') prefix = 'BK';

    let docType = await this.prisma.documentType.findFirst({
      where: { OR: [{ prefix }, { prefix: dto.prefix }] },
    });

    if (!docType) {
      docType = await this.prisma.documentType.findFirst() || await this.prisma.documentType.create({
        data: { type_name: `${prefix} Form`, prefix },
      });
    }

    // 4. Auto-generate doc_number using transaction
    const docNumber = await this.prisma.$transaction(async (tx) => {
      let running = await tx.runningNumber.findUnique({
        where: { document_type_id: docType.id },
      });

      if (!running) {
        running = await tx.runningNumber.create({
          data: {
            document_type_id: docType.id,
            prefix: docType.prefix,
            year_format: 'YYYY',
            current_number: 0,
            padding_length: 4,
          },
        });
      }

      const nextNum = running.current_number + 1;
      await tx.runningNumber.update({
        where: { id: running.id },
        data: { current_number: nextNum },
      });

      const year = new Date().getFullYear();
      const paddedStr = String(nextNum).padStart(running.padding_length, '0');
      return `${docType.prefix}-${year}-${paddedStr}`;
    });

    // 5. Calculate Items
    let totalAmount = 0;
    const itemsData = (dto.items || []).map((item) => {
      const itemTotal = Number(item.quantity || 1) * Number(item.unit_price || 0);
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

    // 6. Resolve Workflow Approver IDs safely
    const processedSteps = await Promise.all(
      (dto.workflow_steps || []).map(async (s) => {
        let approverId: string | null = null;
        if (s.approver_id) {
          const user = await this.prisma.user.findFirst({
            where: { OR: [{ id: s.approver_id }, { username: s.approver_id }, { first_name: s.approver_id }] },
          });
          if (user) approverId = user.id;
        }
        return {
          step_order: s.step_order,
          approver_id: approverId,
          status: 'Pending' as const,
        };
      })
    );

    const defaultWorkflowSteps = processedSteps.length > 0
      ? processedSteps
      : [{ step_order: 1, approver_id: null, status: 'Pending' as const }];

    // 7. Create Document & Specific Form
    const docData: any = {
      doc_number: docNumber,
      title: dto.title,
      type_id: docType.id,
      creator_id: creatorId,
      status: 'Pending',
      workflow: {
        create: {
          total_steps: defaultWorkflowSteps.length,
          current_step: 1,
          status: 'Pending',
          steps: {
            create: defaultWorkflowSteps,
          },
        },
      },
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
          items: {
            create: itemsData.map((it) => ({
              ...it,
              vat: 7,
            })),
          },
        },
      };
    } else if (prefix === 'BK' || prefix === 'MEMO') {
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
          include: { steps: true },
        },
      },
    });

    return this.mapDocumentToResponse(createdDoc);
  }

  async softDelete(id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { OR: [{ id }, { doc_number: id }] },
    });

    if (!doc) throw new NotFoundException('ไม่พบเอกสาร');

    await this.prisma.document.update({
      where: { id: doc.id },
      data: { is_deleted: true },
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
