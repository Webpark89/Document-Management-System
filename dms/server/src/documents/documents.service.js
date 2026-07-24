"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DocumentsService = class DocumentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(status, type, search) {
        const where = { is_deleted: false };
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
                workflow: {
                    include: { steps: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
        return docs.map((d) => this.mapDocumentToResponse(d));
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException(`ไม่พบเอกสารรหัส ${id}`);
        }
        return this.mapDocumentToResponse(doc);
    }
    async create(dto, creatorId) {
        const docType = await this.prisma.documentType.findUnique({
            where: { prefix: dto.prefix },
        });
        if (!docType) {
            throw new common_1.BadRequestException(`ประเภทเอกสาร ${dto.prefix} ไม่ถูกต้อง`);
        }
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
        const creator = await this.prisma.user.findUnique({
            where: { id: creatorId },
        });
        let totalAmount = 0;
        const prItemsData = (dto.items || []).map((item) => {
            const itemTotal = item.quantity * item.unit_price;
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
        const createdDoc = await this.prisma.document.create({
            data: {
                doc_number: docNumber,
                title: dto.title,
                type_id: docType.id,
                creator_id: creatorId,
                status: 'Pending',
                pr_form: {
                    create: {
                        requester_id: creatorId,
                        department_id: creator?.department_id || '',
                        purpose: dto.purpose || '',
                        total_amount: totalAmount,
                        requested_date: new Date(),
                        items: { create: prItemsData },
                    },
                },
                workflow: {
                    create: {
                        total_steps: dto.workflow_steps?.length || 1,
                        current_step: 1,
                        status: 'Pending',
                        steps: {
                            create: (dto.workflow_steps || []).map((s) => ({
                                step_order: s.step_order,
                                approver_id: s.approver_id,
                                status: 'Pending',
                            })),
                        },
                    },
                },
            },
            include: {
                type: true,
                creator: true,
            },
        });
        return this.mapDocumentToResponse(createdDoc);
    }
    async softDelete(id) {
        const doc = await this.prisma.document.findFirst({
            where: { OR: [{ id }, { doc_number: id }] },
        });
        if (!doc)
            throw new common_1.NotFoundException('ไม่พบเอกสาร');
        await this.prisma.document.update({
            where: { id: doc.id },
            data: { is_deleted: true },
        });
        return { success: true, message: 'ลบเอกสารสำเร็จ' };
    }
    mapDocumentToResponse(doc) {
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
            workflow: doc.workflow,
            versions: doc.versions,
        };
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map