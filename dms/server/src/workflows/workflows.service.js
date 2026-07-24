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
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let WorkflowsService = class WorkflowsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getApprovalsForUser(userId) {
        const steps = await this.prisma.workflowStep.findMany({
            where: {
                approver_id: userId,
                status: 'Pending',
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
                        steps: { orderBy: { step_order: 'asc' } },
                    },
                },
            },
            orderBy: { workflow: { created_at: 'desc' } },
        });
        return steps.map((s) => {
            const doc = s.workflow.document;
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
                docId: doc.doc_number || doc.id,
                docName: doc.title,
                name: doc.title,
                type: doc.type?.prefix || 'PR',
                sender: creatorName,
                submittedDate: new Date(doc.created_at).toLocaleDateString('th-TH'),
                amount,
                status: doc.status,
                stepOrder: s.step_order,
                totalSteps: s.workflow.total_steps,
                comment: s.comment,
            };
        });
    }
    async getWorkflowByDoc(documentId) {
        const doc = await this.prisma.document.findFirst({
            where: { OR: [{ id: documentId }, { doc_number: documentId }] },
        });
        if (!doc)
            throw new common_1.NotFoundException('ไม่พบเอกสาร');
        const workflow = await this.prisma.workflow.findUnique({
            where: { document_id: doc.id },
            include: {
                steps: {
                    include: { approver: { include: { role: true } } },
                    orderBy: { step_order: 'asc' },
                },
            },
        });
        if (!workflow)
            throw new common_1.NotFoundException('ไม่พบขั้นตอนการอนุมัติ');
        return {
            id: workflow.id,
            document_id: doc.id,
            total_steps: workflow.total_steps,
            current_step: workflow.current_step,
            status: workflow.status,
            steps: workflow.steps.map((s) => ({
                id: s.id,
                step_order: s.step_order,
                approver_name: `${s.approver.first_name} ${s.approver.last_name}`,
                approver_role: s.approver.role?.name || 'Approver',
                status: s.status,
                action_date: s.action_date
                    ? new Date(s.action_date).toLocaleString('th-TH')
                    : undefined,
                comment: s.comment,
                signature_applied: s.signature_applied,
            })),
        };
    }
    async approveStep(documentId, userId, dto) {
        const doc = await this.prisma.document.findFirst({
            where: { OR: [{ id: documentId }, { doc_number: documentId }] },
        });
        if (!doc)
            throw new common_1.NotFoundException('ไม่พบเอกสาร');
        const workflow = await this.prisma.workflow.findUnique({
            where: { document_id: doc.id },
            include: { steps: { orderBy: { step_order: 'asc' } } },
        });
        if (!workflow)
            throw new common_1.NotFoundException('ไม่พบ Workflow');
        const currentStepObj = workflow.steps.find((s) => s.step_order === workflow.current_step);
        if (!currentStepObj) {
            throw new common_1.BadRequestException('ไม่พบขั้นตอนปัจจุบันของการอนุมัติ');
        }
        await this.prisma.workflowStep.update({
            where: { id: currentStepObj.id },
            data: {
                status: 'Approved',
                action_date: new Date(),
                comment: dto.comment,
                approver_id: userId,
            },
        });
        const isLastStep = workflow.current_step >= workflow.total_steps;
        if (isLastStep) {
            await this.prisma.workflow.update({
                where: { id: workflow.id },
                data: { status: 'Approved' },
            });
            await this.prisma.document.update({
                where: { id: doc.id },
                data: { status: 'Approved' },
            });
        }
        else {
            await this.prisma.workflow.update({
                where: { id: workflow.id },
                data: { current_step: workflow.current_step + 1 },
            });
        }
        await this.prisma.notification.create({
            data: {
                user_id: doc.creator_id,
                document_id: doc.id,
                message: isLastStep
                    ? `เอกสาร ${doc.doc_number} ได้รับการอนุมัติครบถ้วนแล้ว`
                    : `เอกสาร ${doc.doc_number} ผ่านการอนุมัติขั้นตอนที่ ${workflow.current_step}`,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                action: 'Approve',
                module: 'Workflow',
                target_id: doc.id,
                details: { doc_number: doc.doc_number, step: workflow.current_step },
            },
        });
        return { success: true, is_completed: isLastStep };
    }
    async rejectStep(documentId, userId, dto) {
        const doc = await this.prisma.document.findFirst({
            where: { OR: [{ id: documentId }, { doc_number: documentId }] },
        });
        if (!doc)
            throw new common_1.NotFoundException('ไม่พบเอกสาร');
        const workflow = await this.prisma.workflow.findUnique({
            where: { document_id: doc.id },
            include: { steps: { orderBy: { step_order: 'asc' } } },
        });
        if (!workflow)
            throw new common_1.NotFoundException('ไม่พบ Workflow');
        const currentStepObj = workflow.steps.find((s) => s.step_order === workflow.current_step);
        if (currentStepObj) {
            await this.prisma.workflowStep.update({
                where: { id: currentStepObj.id },
                data: {
                    status: 'Rejected',
                    action_date: new Date(),
                    comment: dto.comment,
                    return_to_step: dto.return_to_step,
                    approver_id: userId,
                },
            });
        }
        await this.prisma.workflow.update({
            where: { id: workflow.id },
            data: { status: 'Rejected' },
        });
        await this.prisma.document.update({
            where: { id: doc.id },
            data: { status: 'Rejected' },
        });
        await this.prisma.notification.create({
            data: {
                user_id: doc.creator_id,
                document_id: doc.id,
                message: `เอกสาร ${doc.doc_number} ถูกปฏิเสธ: ${dto.comment}`,
            },
        });
        await this.prisma.auditLog.create({
            data: {
                user_id: userId,
                action: 'Reject',
                module: 'Workflow',
                target_id: doc.id,
                details: { doc_number: doc.doc_number, comment: dto.comment },
            },
        });
        return { success: true };
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map