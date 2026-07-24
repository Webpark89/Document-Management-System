import { PrismaClient, DocumentStatus, WorkflowStatus, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding PostgreSQL database with complete system mock data...');

  // ==========================================
  // 1. ROLES
  // ==========================================
  const adminRole = await prisma.role.upsert({ where: { name: 'Administrator' }, update: {}, create: { name: 'Administrator' } });
  const execRole = await prisma.role.upsert({ where: { name: 'Executive' }, update: {}, create: { name: 'Executive' } });
  const managerRole = await prisma.role.upsert({ where: { name: 'Manager' }, update: {}, create: { name: 'Manager' } });
  const employeeRole = await prisma.role.upsert({ where: { name: 'Employee' }, update: {}, create: { name: 'Employee' } });

  // ==========================================
  // 2. DEPARTMENTS
  // ==========================================
  const deptProc = await prisma.department.upsert({ where: { name: 'แผนกจัดซื้อ' }, update: {}, create: { name: 'แผนกจัดซื้อ' } });
  const deptAcc = await prisma.department.upsert({ where: { name: 'แผนกบัญชีและการเงิน' }, update: {}, create: { name: 'แผนกบัญชีและการเงิน' } });
  const deptWH = await prisma.department.upsert({ where: { name: 'แผนกคลังสินค้าและจัดส่ง' }, update: {}, create: { name: 'แผนกคลังสินค้าและจัดส่ง' } });
  const deptIT = await prisma.department.upsert({ where: { name: 'แผนกเทคโนโลยีสารสนเทศ' }, update: {}, create: { name: 'แผนกเทคโนโลยีสารสนเทศ' } });
  const deptHR = await prisma.department.upsert({ where: { name: 'แผนกทรัพยากรบุคคล' }, update: {}, create: { name: 'แผนกทรัพยากรบุคคล' } });
  const deptProd = await prisma.department.upsert({ where: { name: 'แผนกผลิต' }, update: {}, create: { name: 'แผนกผลิต' } });

  // ==========================================
  // 3. POSITIONS
  // ==========================================
  const posMgrProc = await prisma.position.upsert({ where: { name: 'ผู้จัดการฝ่ายจัดซื้อ' }, update: {}, create: { name: 'ผู้จัดการฝ่ายจัดซื้อ' } });
  const posAcc = await prisma.position.upsert({ where: { name: 'เจ้าหน้าที่บัญชี' }, update: {}, create: { name: 'เจ้าหน้าที่บัญชี' } });
  const posHeadWH = await prisma.position.upsert({ where: { name: 'หัวหน้าคลังสินค้า' }, update: {}, create: { name: 'หัวหน้าคลังสินค้า' } });
  const posIT = await prisma.position.upsert({ where: { name: 'ผู้ดูแลระบบ IT' }, update: {}, create: { name: 'ผู้ดูแลระบบ IT' } });
  const posHR = await prisma.position.upsert({ where: { name: 'เจ้าหน้าที่ HR' }, update: {}, create: { name: 'เจ้าหน้าที่ HR' } });
  const posDirProd = await prisma.position.upsert({ where: { name: 'ผู้อำนวยการฝ่ายผลิต' }, update: {}, create: { name: 'ผู้อำนวยการฝ่ายผลิต' } });

  // ==========================================
  // 4. USERS
  // ==========================================
  const passwordHash = await bcrypt.hash('folk2546', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: {
      username: 'admin',
      email: 'admin@company.com',
      password_hash: passwordHash,
      first_name: 'ระบบบำรุงรักษา',
      last_name: 'ผู้ดูแลระบบ',
      role_id: adminRole.id,
      department_id: deptIT.id,
      position_id: posIT.id,
      is_active: true,
      is_deleted: false,
    },
  });

  const userSomchai = await prisma.user.upsert({
    where: { email: 'somchai@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: {
      username: 'somchai',
      email: 'somchai@company.com',
      password_hash: passwordHash,
      first_name: 'สมชาย',
      last_name: 'ใจดี',
      role_id: managerRole.id,
      department_id: deptProc.id,
      position_id: posMgrProc.id,
      is_active: true,
      is_deleted: false,
    },
  });

  const userSuda = await prisma.user.upsert({
    where: { email: 'suda@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: {
      username: 'suda',
      email: 'suda@company.com',
      password_hash: passwordHash,
      first_name: 'สุดา',
      last_name: 'วงศ์ศรี',
      role_id: employeeRole.id,
      department_id: deptAcc.id,
      position_id: posAcc.id,
      is_active: true,
      is_deleted: false,
    },
  });

  const userWipa = await prisma.user.upsert({
    where: { email: 'wipa@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: {
      username: 'manager01',
      email: 'wipa@company.com',
      password_hash: passwordHash,
      first_name: 'วิภา',
      last_name: 'รักดี',
      role_id: managerRole.id,
      department_id: deptWH.id,
      position_id: posHeadWH.id,
      is_active: true,
      is_deleted: false,
    },
  });

  const userPrasert = await prisma.user.upsert({
    where: { email: 'prasert@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: {
      username: 'prasert',
      email: 'prasert@company.com',
      password_hash: passwordHash,
      first_name: 'ประเสริฐ',
      last_name: 'มีสุข',
      role_id: execRole.id,
      department_id: deptIT.id,
      position_id: posIT.id,
      is_active: true,
      is_deleted: false,
    },
  });

  const userNapa = await prisma.user.upsert({
    where: { email: 'napa@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: {
      username: 'napa',
      email: 'napa@company.com',
      password_hash: passwordHash,
      first_name: 'นภา',
      last_name: 'สุขใจ',
      role_id: employeeRole.id,
      department_id: deptHR.id,
      position_id: posHR.id,
      is_active: true,
      is_deleted: false,
    },
  });

  const userKittisak = await prisma.user.upsert({
    where: { email: 'kittisak@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: {
      username: 'kittisak',
      email: 'kittisak@company.com',
      password_hash: passwordHash,
      first_name: 'กิตติศักดิ์',
      last_name: 'พรหมมา',
      role_id: execRole.id,
      department_id: deptProd.id,
      position_id: posDirProd.id,
      is_active: true,
      is_deleted: false,
    },
  });

  // ==========================================
  // 5. DOCUMENT TYPES
  // ==========================================
  const dtPR = await prisma.documentType.upsert({ where: { prefix: 'PR' }, update: {}, create: { type_name: 'ใบขอซื้อ (PR)', prefix: 'PR' } });
  const dtPO = await prisma.documentType.upsert({ where: { prefix: 'PO' }, update: {}, create: { type_name: 'ใบสั่งซื้อ (PO)', prefix: 'PO' } });
  const dtBK = await prisma.documentType.upsert({ where: { prefix: 'BK' }, update: {}, create: { type_name: 'บันทึกข้อความ (BK)', prefix: 'BK' } });
  const dtOther = await prisma.documentType.upsert({ where: { prefix: 'OTHER' }, update: {}, create: { type_name: 'เอกสารอื่นๆ (OTHER)', prefix: 'OTHER' } });

  // ==========================================
  // 6. RUNNING NUMBERS
  // ==========================================
  await prisma.runningNumber.upsert({ where: { document_type_id: dtPR.id }, update: { current_number: 10 }, create: { document_type_id: dtPR.id, prefix: 'PR', year_format: 'YYYY', current_number: 10, padding_length: 4, last_reset_year: 2026 } });
  await prisma.runningNumber.upsert({ where: { document_type_id: dtPO.id }, update: { current_number: 5 }, create: { document_type_id: dtPO.id, prefix: 'PO', year_format: 'YYYY', current_number: 5, padding_length: 4, last_reset_year: 2026 } });
  await prisma.runningNumber.upsert({ where: { document_type_id: dtBK.id }, update: { current_number: 3 }, create: { document_type_id: dtBK.id, prefix: 'BK', year_format: 'YYYY', current_number: 3, padding_length: 4, last_reset_year: 2026 } });
  await prisma.runningNumber.upsert({ where: { document_type_id: dtOther.id }, update: { current_number: 2 }, create: { document_type_id: dtOther.id, prefix: 'OTHER', year_format: 'YYYY', current_number: 2, padding_length: 4, last_reset_year: 2026 } });

  // ==========================================
  // 7. APPROVAL MATRIX
  // ==========================================
  await prisma.approvalMatrix.deleteMany();
  await prisma.approvalMatrix.createMany({
    data: [
      { document_type_id: dtPR.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtPR.id, step_order: 2, required_role_id: execRole.id },
      { document_type_id: dtPR.id, step_order: 3, required_role_id: adminRole.id },
      { document_type_id: dtPO.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtPO.id, step_order: 2, required_role_id: execRole.id },
      { document_type_id: dtPO.id, step_order: 3, required_role_id: adminRole.id },
      { document_type_id: dtBK.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtBK.id, step_order: 2, required_role_id: execRole.id },
      { document_type_id: dtOther.id, step_order: 1, required_role_id: managerRole.id },
    ],
  });

  // Clean old transactional data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflow.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.pRFormItem.deleteMany();
  await prisma.pRForm.deleteMany();
  await prisma.pOFormItem.deleteMany();
  await prisma.pOForm.deleteMany();
  await prisma.bKForm.deleteMany();
  await prisma.document.deleteMany();

  // ==========================================
  // 8. DOCUMENTS & FULL WORKFLOWS
  // ==========================================

  // Document 1: PR-2026-0001 (Pending Review - 3 Steps)
  const doc1 = await prisma.document.create({
    data: {
      doc_number: 'PR-2026-0001',
      title: 'ขอซื้ออุปกรณ์สำนักงานประจำไตรมาส 3/2026',
      type_id: dtPR.id,
      creator_id: userSomchai.id,
      status: DocumentStatus.Pending,
      created_at: new Date('2026-07-20T09:30:00Z'),
      updated_at: new Date('2026-07-21T10:15:00Z'),
      pr_form: {
        create: {
          requester_id: userSomchai.id,
          department_id: deptProc.id,
          purpose: 'จัดซื้ออุปกรณ์สำนักงานเพิ่มเติมสำหรับพนักงานใหม่และทดแทนของเดิมที่ชำรุด',
          total_amount: 15500,
          requested_date: new Date('2026-07-20T09:30:00Z'),
          required_date: new Date('2026-07-30T09:30:00Z'),
          items: {
            create: [
              { item_name: 'กระดาษ A4 80gsm (แพ็ค 5 เล่ม)', quantity: 20, unit: 'กล่อง', unit_price: 550, total_price: 11000, remark: 'สำหรับแผนกจัดซื้อและบัญชี' },
              { item_name: 'ปากกาลูกลื่นสีน้ำเงิน 0.5mm', quantity: 10, unit: 'โหล', unit_price: 150, total_price: 1500, remark: 'ตรา Horse' },
              { item_name: 'เครื่องเย็บกระดาษเบอร์ 10', quantity: 10, unit: 'เครื่อง', unit_price: 300, total_price: 3000, remark: 'ตราช้าง' },
            ],
          },
        },
      },
      workflow: {
        create: {
          total_steps: 3,
          current_step: 2,
          status: WorkflowStatus.Pending,
          steps: {
            create: [
              { step_order: 1, approver_id: userWipa.id, status: WorkflowStatus.Approved, action_date: new Date('2026-07-21T10:15:00Z'), comment: 'อนุมัติเรียบร้อย ตรวจสอบรายการตรงตามงบประมาณ', signature_applied: true },
              { step_order: 2, approver_id: userPrasert.id, status: WorkflowStatus.Pending },
              { step_order: 3, approver_id: adminUser.id, status: WorkflowStatus.Pending },
            ],
          },
        },
      },
    },
  });

  // Document 2: PO-2026-0001 (Approved - Version History)
  const doc2 = await prisma.document.create({
    data: {
      doc_number: 'PO-2026-0001',
      title: 'ใบสั่งซื้อ คอมพิวเตอร์โน้ตบุ๊ก Dell สำหรับทีมพัฒนาระบบ IT',
      type_id: dtPO.id,
      creator_id: userWipa.id,
      status: DocumentStatus.Approved,
      created_at: new Date('2026-07-15T11:00:00Z'),
      updated_at: new Date('2026-07-18T16:20:00Z'),
      po_form: {
        create: {
          vendor_name: 'บริษัท เดลล์ คอร์ปอเรชั่น (ประเทศไทย) จำกัด',
          vendor_contact: '02-670-7000 (คุณกิตติ)',
          delivery_date: new Date('2026-07-28T00:00:00Z'),
          payment_terms: 'เครดิต 30 วัน',
          total_amount: 96300,
          items: {
            create: [
              { item_name: 'Dell Latitude 5540 i7-1355U RAM 16GB SSD 512GB', quantity: 2, unit: 'เครื่อง', unit_price: 42000, vat: 7, total_price: 89880, remark: 'รวมประกัน 3 ปี Onsite' },
              { item_name: 'Dell 27 Monitor SE2723DS 2K', quantity: 2, unit: 'จอ', unit_price: 3000, vat: 7, total_price: 6420, remark: 'จอเสริมสำหรับเขียนโค้ด' },
            ],
          },
        },
      },
      workflow: {
        create: {
          total_steps: 3,
          current_step: 3,
          status: WorkflowStatus.Approved,
          steps: {
            create: [
              { step_order: 1, approver_id: userSomchai.id, status: WorkflowStatus.Approved, action_date: new Date('2026-07-16T09:00:00Z'), comment: 'อนุมัติการจัดซื้อตรงตามใบเสนอราคา', signature_applied: true },
              { step_order: 2, approver_id: userPrasert.id, status: WorkflowStatus.Approved, action_date: new Date('2026-07-17T14:30:00Z'), comment: 'อนุมัติผ่านงบไอทีประจำปี', signature_applied: true },
              { step_order: 3, approver_id: adminUser.id, status: WorkflowStatus.Approved, action_date: new Date('2026-07-18T16:20:00Z'), comment: 'ประทับลายเซ็นและอนุมัติขั้นสุดท้ายเรียบร้อย', signature_applied: true },
            ],
          },
        },
      },
    },
  });

  // Document 3: BK-2026-0001 (Pending Review)
  const doc3 = await prisma.document.create({
    data: {
      doc_number: 'BK-2026-0001',
      title: 'บันทึกขออนุมัติจัดกิจกรรมอบรมความปลอดภัยการทำงานประจำปี 2026',
      type_id: dtBK.id,
      creator_id: userSuda.id,
      status: DocumentStatus.Pending,
      created_at: new Date('2026-07-22T08:30:00Z'),
      updated_at: new Date('2026-07-22T13:10:00Z'),
      bk_form: {
        create: {
          subject: 'ขออนุมัติจัดกิจกรรมอบรมความปลอดภัยการทำงานประจำปี 2026',
          detail: 'เรียน ผู้จัดการฝ่ายทรัพยากรบุคคลและผู้บริหาร ทางแผนกขออนุมัติจัดอบรมความปลอดภัยสำหรับพนักงานใหม่จำนวน 45 คน ในวันที่ 15 สิงหาคม 2026 ณ ห้องประชุมใหญ่',
          department_id: deptAcc.id,
        },
      },
      workflow: {
        create: {
          total_steps: 2,
          current_step: 1,
          status: WorkflowStatus.Pending,
          steps: {
            create: [
              { step_order: 1, approver_id: userSomchai.id, status: WorkflowStatus.Pending },
              { step_order: 2, approver_id: userKittisak.id, status: WorkflowStatus.Pending },
            ],
          },
        },
      },
    },
  });

  // Document 4: PR-2026-0002 (Rejected Document)
  const doc4 = await prisma.document.create({
    data: {
      doc_number: 'PR-2026-0002',
      title: 'ขอซื้อเก้าอี้เพื่อสุขภาพ Ergonomics สำหรับแผนกออกแบบ',
      type_id: dtPR.id,
      creator_id: userNapa.id,
      status: DocumentStatus.Rejected,
      created_at: new Date('2026-07-12T10:00:00Z'),
      updated_at: new Date('2026-07-14T11:45:00Z'),
      pr_form: {
        create: {
          requester_id: userNapa.id,
          department_id: deptHR.id,
          purpose: 'ปรับปรุงสุขภาพในการทำงานของพนักงาน',
          total_amount: 35000,
          requested_date: new Date('2026-07-12T10:00:00Z'),
          items: {
            create: [
              { item_name: 'Ergonomic Chair Model X', quantity: 5, unit: 'ตัว', unit_price: 7000, total_price: 35000, remark: 'ยี่ห้อ ErgoFlex' },
            ],
          },
        },
      },
      workflow: {
        create: {
          total_steps: 2,
          current_step: 2,
          status: WorkflowStatus.Rejected,
          steps: {
            create: [
              { step_order: 1, approver_id: userSomchai.id, status: WorkflowStatus.Approved, action_date: new Date('2026-07-13T09:15:00Z'), comment: 'เห็นควรอนุมัติ' },
              { step_order: 2, approver_id: userKittisak.id, status: WorkflowStatus.Rejected, action_date: new Date('2026-07-14T11:45:00Z'), comment: 'ปฏิเสธเนื่องจากเกินงบประมาณสวัสดิการหมวดครุภัณฑ์ กรุณาปรับลดจำนวนลงเหลือ 2 ตัว' },
            ],
          },
        },
      },
    },
  });

  // ==========================================
  // 9. DOCUMENT VERSIONS (ประวัติเวอร์ชันเอกสาร)
  // ==========================================
  await prisma.documentVersion.createMany({
    data: [
      {
        document_id: doc2.id,
        version_number: 1,
        file_path: '/uploads/documents/po_2026_0001_v1.pdf',
        file_size: '1.2 MB',
        file_extension: 'pdf',
        uploaded_by_id: userWipa.id,
        remarks: 'อัปโหลดฉบับร่างแรกสำหรับเสนออนุมัติสั่งซื้อ',
        created_at: new Date('2026-07-15T11:00:00Z'),
      },
      {
        document_id: doc2.id,
        version_number: 2,
        file_path: '/uploads/documents/po_2026_0001_v2_signed.pdf',
        file_size: '1.4 MB',
        file_extension: 'pdf',
        uploaded_by_id: adminUser.id,
        remarks: 'ฉบับสมบูรณ์ที่ผ่านการประทับลายเซ็นอิเล็กทรอนิกส์ครบ 3 ระดับ',
        created_at: new Date('2026-07-18T16:20:00Z'),
      },
      {
        document_id: doc1.id,
        version_number: 1,
        file_path: '/uploads/documents/pr_2026_0001_v1.pdf',
        file_size: '850 KB',
        file_extension: 'pdf',
        uploaded_by_id: userSomchai.id,
        remarks: 'ต้นฉบับใบขอซื้ออุปกรณ์สำนักงาน Q3',
        created_at: new Date('2026-07-20T09:30:00Z'),
      },
    ],
  });

  // ==========================================
  // 10. NOTIFICATIONS
  // ==========================================
  await prisma.notification.createMany({
    data: [
      { user_id: userPrasert.id, document_id: doc1.id, message: 'เอกสาร PR-2026-0001 ขอซื้ออุปกรณ์สำนักงาน รอการอนุมัติจากคุณ (Step 2)', is_read: false, created_at: new Date('2026-07-21T10:15:00Z') },
      { user_id: userSomchai.id, document_id: doc3.id, message: 'เอกสาร BK-2026-0001 บันทึกขออนุมัติจัดกิจกรรมอบรม รอการอนุมัติจากคุณ (Step 1)', is_read: false, created_at: new Date('2026-07-22T08:30:00Z') },
      { user_id: userWipa.id, document_id: doc2.id, message: 'เอกสาร PO-2026-0001 ได้รับการอนุมัติเสร็จสมบูรณ์เรียบร้อยแล้ว', is_read: true, read_at: new Date('2026-07-18T17:00:00Z'), created_at: new Date('2026-07-18T16:20:00Z') },
      { user_id: userNapa.id, document_id: doc4.id, message: 'เอกสาร PR-2026-0002 ถูกปฏิเสธ (Rejected) โดย คุณกิตติศักดิ์ พรหมมา', is_read: true, read_at: new Date('2026-07-14T12:00:00Z'), created_at: new Date('2026-07-14T11:45:00Z') },
    ],
  });

  // ==========================================
  // 11. AUDIT LOGS (ประวัติการใช้งานระบบ)
  // ==========================================
  await prisma.auditLog.createMany({
    data: [
      {
        user_id: adminUser.id,
        action: AuditAction.Login,
        module: 'Auth',
        target_id: adminUser.id,
        details: { oldState: null, newState: { username: 'admin' }, extra: 'เข้าสู่ระบบสำเร็จผ่าน Web Dashboard' },
        ip_address: '127.0.0.1',
        created_at: new Date('2026-07-24T09:00:00Z'),
      },
      {
        user_id: userSomchai.id,
        action: AuditAction.Upload,
        module: 'Document',
        target_id: doc1.id,
        details: { oldState: null, newState: { doc_number: 'PR-2026-0001', status: 'Pending' }, extra: 'สร้างเอกสารขอซื้ออุปกรณ์สำนักงาน Q3' },
        ip_address: '192.168.1.45',
        created_at: new Date('2026-07-20T09:30:00Z'),
      },
      {
        user_id: userWipa.id,
        action: AuditAction.Approve,
        module: 'Workflow',
        target_id: doc1.id,
        details: { oldState: { current_step: 1 }, newState: { current_step: 2, step1_status: 'Approved' }, extra: 'อนุมัติ Step 1 เรียบร้อย' },
        ip_address: '192.168.1.52',
        created_at: new Date('2026-07-21T10:15:00Z'),
      },
      {
        user_id: adminUser.id,
        action: AuditAction.Signature,
        module: 'E-Signature',
        target_id: doc2.id,
        details: { oldState: { version: 1 }, newState: { version: 2, signature_applied: true }, extra: 'ประทับลายเซ็นอิเล็กทรอนิกส์สำเร็จผ่าน PDF-LIB' },
        ip_address: '127.0.0.1',
        created_at: new Date('2026-07-18T16:20:00Z'),
      },
      {
        user_id: userKittisak.id,
        action: AuditAction.Reject,
        module: 'Workflow',
        target_id: doc4.id,
        details: { oldState: { status: 'Pending' }, newState: { status: 'Rejected' }, extra: 'ปฏิเสธเนื่องจากเกินงบประมาณ' },
        ip_address: '192.168.1.88',
        created_at: new Date('2026-07-14T11:45:00Z'),
      },
    ],
  });

  console.log('✅ Complete system seed finished! Ready for full DB testing.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
