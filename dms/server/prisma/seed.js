"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database with full mock data...');
    const adminRole = await prisma.role.upsert({ where: { name: 'Administrator' }, update: {}, create: { name: 'Administrator' } });
    const execRole = await prisma.role.upsert({ where: { name: 'Executive' }, update: {}, create: { name: 'Executive' } });
    const managerRole = await prisma.role.upsert({ where: { name: 'Manager' }, update: {}, create: { name: 'Manager' } });
    const employeeRole = await prisma.role.upsert({ where: { name: 'Employee' }, update: {}, create: { name: 'Employee' } });
    const deptProc = await prisma.department.upsert({ where: { name: 'แผนกจัดซื้อ' }, update: {}, create: { name: 'แผนกจัดซื้อ' } });
    const deptAcc = await prisma.department.upsert({ where: { name: 'แผนกบัญชีและการเงิน' }, update: {}, create: { name: 'แผนกบัญชีและการเงิน' } });
    const deptWH = await prisma.department.upsert({ where: { name: 'แผนกคลังสินค้าและจัดส่ง' }, update: {}, create: { name: 'แผนกคลังสินค้าและจัดส่ง' } });
    const deptIT = await prisma.department.upsert({ where: { name: 'แผนกเทคโนโลยีสารสนเทศ' }, update: {}, create: { name: 'แผนกเทคโนโลยีสารสนเทศ' } });
    const deptHR = await prisma.department.upsert({ where: { name: 'แผนกทรัพยากรบุคคล' }, update: {}, create: { name: 'แผนกทรัพยากรบุคคล' } });
    const deptProd = await prisma.department.upsert({ where: { name: 'แผนกผลิต' }, update: {}, create: { name: 'แผนกผลิต' } });
    const posMgrProc = await prisma.position.upsert({ where: { name: 'ผู้จัดการฝ่ายจัดซื้อ' }, update: {}, create: { name: 'ผู้จัดการฝ่ายจัดซื้อ' } });
    const posAcc = await prisma.position.upsert({ where: { name: 'เจ้าหน้าที่บัญชี' }, update: {}, create: { name: 'เจ้าหน้าที่บัญชี' } });
    const posHeadWH = await prisma.position.upsert({ where: { name: 'หัวหน้าคลังสินค้า' }, update: {}, create: { name: 'หัวหน้าคลังสินค้า' } });
    const posIT = await prisma.position.upsert({ where: { name: 'ผู้ดูแลระบบ IT' }, update: {}, create: { name: 'ผู้ดูแลระบบ IT' } });
    const posHR = await prisma.position.upsert({ where: { name: 'เจ้าหน้าที่ HR' }, update: {}, create: { name: 'เจ้าหน้าที่ HR' } });
    const posDirProd = await prisma.position.upsert({ where: { name: 'ผู้อำนวยการฝ่ายผลิต' }, update: {}, create: { name: 'ผู้อำนวยการฝ่ายผลิต' } });
    const passwordHash = await bcrypt.hash('folk2546', 10);
    const userSomchai = await prisma.user.upsert({
        where: { email: 'somchai@company.com' },
        update: {},
        create: { username: 'somchai', email: 'somchai@company.com', password_hash: passwordHash, first_name: 'สมชาย', last_name: 'ใจดี', role_id: managerRole.id, department_id: deptProc.id, position_id: posMgrProc.id },
    });
    const userSuda = await prisma.user.upsert({
        where: { email: 'suda@company.com' },
        update: {},
        create: { username: 'suda', email: 'suda@company.com', password_hash: passwordHash, first_name: 'สุดา', last_name: 'วงศ์ศรี', role_id: employeeRole.id, department_id: deptAcc.id, position_id: posAcc.id },
    });
    const userWipa = await prisma.user.upsert({
        where: { email: 'wipa@company.com' },
        update: {},
        create: { username: 'manager01', email: 'wipa@company.com', password_hash: passwordHash, first_name: 'วิภา', last_name: 'รักดี', role_id: managerRole.id, department_id: deptWH.id, position_id: posHeadWH.id },
    });
    const userPrasert = await prisma.user.upsert({
        where: { email: 'prasert@company.com' },
        update: {},
        create: { username: 'prasert', email: 'prasert@company.com', password_hash: passwordHash, first_name: 'ประเสริฐ', last_name: 'มีสุข', role_id: execRole.id, department_id: deptIT.id, position_id: posIT.id },
    });
    const userNapa = await prisma.user.upsert({
        where: { email: 'napa@company.com' },
        update: {},
        create: { username: 'napa', email: 'napa@company.com', password_hash: passwordHash, first_name: 'นภา', last_name: 'สุขใจ', role_id: employeeRole.id, department_id: deptHR.id, position_id: posHR.id },
    });
    const userKittisak = await prisma.user.upsert({
        where: { email: 'kittisak@company.com' },
        update: {},
        create: { username: 'kittisak', email: 'kittisak@company.com', password_hash: passwordHash, first_name: 'กิตติศักดิ์', last_name: 'พรหมมา', role_id: execRole.id, department_id: deptProd.id, position_id: posDirProd.id },
    });
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: { password_hash: passwordHash },
        create: { username: 'admin', email: 'admin@company.com', password_hash: passwordHash, first_name: 'Admin', last_name: 'System', role_id: adminRole.id, department_id: deptIT.id, position_id: posIT.id },
    });
    const dtPR = await prisma.documentType.upsert({ where: { prefix: 'PR' }, update: {}, create: { type_name: 'ใบขอซื้อ (PR)', prefix: 'PR' } });
    const dtPO = await prisma.documentType.upsert({ where: { prefix: 'PO' }, update: {}, create: { type_name: 'ใบสั่งซื้อ (PO)', prefix: 'PO' } });
    const dtMemo = await prisma.documentType.upsert({ where: { prefix: 'MEMO' }, update: {}, create: { type_name: 'บันทึกข้อความ (MEMO)', prefix: 'MEMO' } });
    const dtOther = await prisma.documentType.upsert({ where: { prefix: 'OTHER' }, update: {}, create: { type_name: 'เอกสารอื่นๆ (OTHER)', prefix: 'OTHER' } });
    await prisma.runningNumber.upsert({ where: { document_type_id: dtPR.id }, update: {}, create: { document_type_id: dtPR.id, prefix: 'PR', year_format: 'YYYY', current_number: 5, padding_length: 4 } });
    await prisma.runningNumber.upsert({ where: { document_type_id: dtPO.id }, update: {}, create: { document_type_id: dtPO.id, prefix: 'PO', year_format: 'YYYY', current_number: 4, padding_length: 4 } });
    await prisma.runningNumber.upsert({ where: { document_type_id: dtMemo.id }, update: {}, create: { document_type_id: dtMemo.id, prefix: 'MEMO', year_format: 'YYYY', current_number: 2, padding_length: 4 } });
    await prisma.runningNumber.upsert({ where: { document_type_id: dtOther.id }, update: {}, create: { document_type_id: dtOther.id, prefix: 'OTHER', year_format: 'YYYY', current_number: 2, padding_length: 4 } });
    await prisma.approvalMatrix.deleteMany();
    await prisma.approvalMatrix.createMany({ data: [
            { document_type_id: dtPR.id, step_order: 1, required_role_id: managerRole.id },
            { document_type_id: dtPR.id, step_order: 2, required_role_id: execRole.id },
            { document_type_id: dtPR.id, step_order: 3, required_role_id: managerRole.id }
        ] });
    await prisma.workflowStep.deleteMany();
    await prisma.workflow.deleteMany();
    await prisma.documentVersion.deleteMany();
    await prisma.pRForm.deleteMany();
    await prisma.pOForm.deleteMany();
    await prisma.document.deleteMany();
    const doc1 = await prisma.document.create({
        data: {
            doc_number: 'PR-2026-0001', title: 'ขอซื้ออุปกรณ์สำนักงาน Q3/2026', type_id: dtPR.id, creator_id: userSomchai.id, status: client_1.DocumentStatus.Pending, created_at: new Date('2026-07-10T09:00:00Z'), updated_at: new Date('2026-07-10T09:00:00Z'),
            pr_form: { create: { requester_id: userSomchai.id, department_id: deptProc.id, total_amount: 15000, purpose: 'ใช้งานในออฟฟิศ' } },
            workflow: { create: { total_steps: 3, current_step: 1, status: client_1.WorkflowStatus.Pending, steps: { create: [{ step_order: 1, approver_id: userWipa.id, status: client_1.WorkflowStatus.Pending }] } } }
        }
    });
    const doc2 = await prisma.document.create({
        data: {
            doc_number: 'PO-2026-0001', title: 'ใบสั่งซื้อ Laptop Dell สำหรับทีม IT', type_id: dtPO.id, creator_id: userWipa.id, status: client_1.DocumentStatus.Approved, created_at: new Date('2026-07-08T14:00:00Z'), updated_at: new Date('2026-07-12T10:00:00Z'),
            po_form: { create: { vendor_name: 'Dell Thailand', total_amount: 45000 } },
            workflow: { create: { total_steps: 4, current_step: 4, status: client_1.WorkflowStatus.Approved, steps: { create: [{ step_order: 1, approver_id: userSomchai.id, status: client_1.WorkflowStatus.Approved, action_date: new Date('2026-07-12T09:30:00Z') }] } } }
        }
    });
    const doc3 = await prisma.document.create({
        data: {
            doc_number: 'PR-2026-0002', title: 'ขอซื้อวัสดุสิ้นเปลืองสำหรับโรงงาน', type_id: dtPR.id, creator_id: userNapa.id, status: client_1.DocumentStatus.Draft, created_at: new Date('2026-07-13T11:00:00Z'), updated_at: new Date('2026-07-13T11:00:00Z'),
            pr_form: { create: { requester_id: userNapa.id, department_id: deptHR.id, total_amount: 25000 } }
        }
    });
    await prisma.notification.deleteMany();
    await prisma.notification.createMany({
        data: [
            { user_id: userWipa.id, document_id: doc1.id, message: 'เอกสาร PR-2026-0001 รออนุมัติจากคุณ', is_read: false, created_at: new Date('2026-07-14T08:00:00Z') },
            { user_id: userWipa.id, document_id: doc2.id, message: 'เอกสาร PO-2026-0001 ได้รับการอนุมัติแล้ว', is_read: true, created_at: new Date('2026-07-12T10:00:00Z') }
        ]
    });
    console.log('Mock Data Seeding completed successfully!');
}
main()
    .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map