import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing DMS master data...');

  // ==========================================
  // 1. CLEAN UP OLD DATA
  // ==========================================
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
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.approvalMatrix.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();

  // ==========================================
  // 2. ROLES & DEPARTMENTS
  // ==========================================
  const adminRole = await prisma.role.upsert({ where: { name: 'Administrator' }, update: {}, create: { name: 'Administrator' } });
  const execRole = await prisma.role.upsert({ where: { name: 'Executive' }, update: {}, create: { name: 'Executive' } });
  const managerRole = await prisma.role.upsert({ where: { name: 'Manager' }, update: {}, create: { name: 'Manager' } });
  const employeeRole = await prisma.role.upsert({ where: { name: 'Employee' }, update: {}, create: { name: 'Employee' } });

  // ==========================================
  // 2.5 SEED DEFAULT PERMISSIONS
  // ==========================================
  // Helper: upsert permission and assign to role
  async function grantPermission(roleId: string, module: string, action: string) {
    const perm = await prisma.permission.upsert({
      where: { module_action: { module, action } },
      update: {},
      create: { module, action },
    });
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: roleId, permission_id: perm.id } },
      update: {},
      create: { role_id: roleId, permission_id: perm.id },
    });
  }

  // --- Employee permissions (basic) ---
  const employeePerms: [string, string][] = [
    ['dashboard.view_employee', 'view'],
    ['dashboard.employee_stat_cards', 'view'],
    ['dashboard.employee_submissions_status', 'view'],
    ['dashboard.employee_recent_docs', 'view'],
    ['dashboard.employee_docs_status_chart', 'view'],
    // ส่งเรื่องขออนุมัติ - ดูเอกสารที่ฉันส่ง + สร้างเอกสาร
    ['submissions.view_list', 'view'],
    ['submissions.search_sort', 'view'],
    ['submissions.filter_status', 'view'],
    ['submissions.open_doc_detail', 'view'],
    ['submissions.create_document', 'create'],
    ['submissions.edit_document', 'edit'],
    ['submissions.delete_document', 'delete'],
    ['submissions.submit_document', 'create'],
    ['submissions.view_approval_history', 'view'],
    // คลังเอกสาร
    ['document.view_list', 'view'],
    ['document.view_detail', 'view'],
    ['document.preview_document', 'view'],
    ['document.search_filter', 'view'],
    ['document.create_document', 'create'],
    ['document.upload_attachment', 'create'],
    ['document.edit_document', 'edit'],
    ['document.submit_document', 'create'],
    ['document.recall_document', 'edit'],
    ['document.delete_document', 'delete'],
    ['document.download_document', 'view'],
    ['document.bulk_select', 'edit'],
    ['document.view_version_history', 'view'],
    ['document.view_timeline', 'view'],
    ['document.place_signature', 'edit'],
    ['document.view_folders', 'view'],
    ['document.manage_folders', 'create'],
    ['document.manage_folders', 'edit'],
    ['document.manage_folders', 'delete'],
    ['document.move_to_folder', 'edit'],
    // อื่นๆ
    ['notifications.view_notifications', 'view'],
    ['notifications.mark_read', 'edit'],
    ['profile.view_own', 'view'],
    ['profile.edit_own', 'edit'],
    ['profile.change_password', 'edit'],
    ['profile.upload_signature', 'edit'],
  ];
  for (const [mod, act] of employeePerms) await grantPermission(employeeRole.id, mod, act);

  // --- Manager permissions (employee + approval in inbox + more) ---
  const managerPerms: [string, string][] = [
    ...employeePerms,
    ['dashboard.view_executive', 'view'],
    ['dashboard.employee_pending_approvals', 'view'],
    ['dashboard.executive_stat_cards', 'view'],
    ['dashboard.executive_docs_type_chart', 'view'],
    ['dashboard.executive_docs_status_chart', 'view'],
    ['dashboard.executive_pending_dept_chart', 'view'],
    ['dashboard.executive_recent_activity', 'view'],
    ['dashboard.executive_bottlenecks', 'view'],
    ['dashboard.executive_view_scope', 'view'],
    // รายการรออนุมัติ - อนุมัติได้
    ['approvals.view_list', 'view'],
    ['approvals.search_sort', 'view'],
    ['approvals.open_doc_detail', 'view'],
    ['approvals.approve_document', 'approve'],
    ['approvals.reject_document', 'approve'],
    ['approvals.return_document', 'approve'],
    ['approvals.place_signature', 'approve'],
    ['approvals.add_comment', 'edit'],
    // คลังเอกสาร - ดู scope ทั้งหมด
    ['document.scope_dropdown', 'view'],
    // Reports
    ['reports.access', 'view'],
    ['reports.view_reports', 'view'],
    ['reports.export_reports', 'view'],
  ];
  for (const [mod, act] of managerPerms) await grantPermission(managerRole.id, mod, act);

  // --- Executive permissions (manager + all dept reports) ---
  const execPerms: [string, string][] = [
    ...managerPerms,
    ['reports.view_all_dept', 'view'],
    ['document.move_any_to_folder', 'edit'],
  ];
  for (const [mod, act] of execPerms) await grantPermission(execRole.id, mod, act);

  // --- Admin-specific permissions (System Config & Master Data) ---
  const adminPerms: [string, string][] = [
    ['config.access', 'view'],
    ['config.role_management', 'view'],
    ['config.role_management', 'create'],
    ['config.role_management', 'edit'],
    ['config.role_management', 'delete'],
    ['config.user_management', 'view'],
    ['config.user_management', 'create'],
    ['config.user_management', 'edit'],
    ['config.user_management', 'delete'],
    ['masterdata.access', 'view'],
    ['masterdata.access', 'create'],
    ['masterdata.access', 'edit'],
    ['masterdata.access', 'delete'],
    ['auditlog.access', 'view']
  ];
  // Grant these explicitly to admin (this creates them in DB)
  for (const [mod, act] of adminPerms) await grantPermission(adminRole.id, mod, act);

  // Administrator gets everything explicitely now for fully dynamic
  const allPermissionsFromDB = await prisma.permission.findMany();
  for (const perm of allPermissionsFromDB) {
    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: adminRole.id, permission_id: perm.id } },
      update: {},
      create: { role_id: adminRole.id, permission_id: perm.id },
    });
  }
  
  console.log('✅ Default role permissions seeded');
  const deptProc = await prisma.department.upsert({ where: { name: 'แผนกจัดซื้อ' }, update: {}, create: { name: 'แผนกจัดซื้อ' } });
  const deptAcc = await prisma.department.upsert({ where: { name: 'แผนกบัญชีและการเงิน' }, update: {}, create: { name: 'แผนกบัญชีและการเงิน' } });
  const deptHR = await prisma.department.upsert({ where: { name: 'แผนกทรัพยากรบุคคล' }, update: {}, create: { name: 'แผนกทรัพยากรบุคคล' } });
  const deptWH = await prisma.department.upsert({ where: { name: 'แผนกคลังสินค้า' }, update: {}, create: { name: 'แผนกคลังสินค้า' } });
  const deptIT = await prisma.department.upsert({ where: { name: 'แผนกเทคโนโลยีสารสนเทศ' }, update: {}, create: { name: 'แผนกเทคโนโลยีสารสนเทศ' } });

  const posStaff = await prisma.position.upsert({ where: { name: 'พนักงาน' }, update: { level: 'L1' }, create: { name: 'พนักงาน', level: 'L1' } });
  const posSupervisor = await prisma.position.upsert({ where: { name: 'หัวหน้าแผนก' }, update: { level: 'L2' }, create: { name: 'หัวหน้าแผนก', level: 'L2' } });
  const posExecutive = await prisma.position.upsert({ where: { name: 'ผู้บริหาร' }, update: { level: 'L5' }, create: { name: 'ผู้บริหาร', level: 'L5' } });

  // ==========================================
  // 3. USERS (ตามที่ผู้ใช้ระบุ)
  // ==========================================
  const passwordHash = await bcrypt.hash('folk2546', 10);

  // 3.1 Administrator
  const userAdmin = await prisma.user.create({
    data: { username: 'admin', email: 'admin@company.com', password_hash: passwordHash, first_name: 'ผู้ดูแลระบบ', last_name: 'สูงสุด', role_id: adminRole.id, department_id: deptIT.id, position_id: posExecutive.id, is_active: true, is_deleted: false }
  });

  // 3.2 Employees
  const userSomchai = await prisma.user.create({
    data: { username: 'somchai', email: 'somchai@company.com', password_hash: passwordHash, first_name: 'สมชาย', last_name: 'ใจดี', role_id: employeeRole.id, department_id: deptProc.id, position_id: posStaff.id, is_active: true, is_deleted: false }
  });

  const userSuda = await prisma.user.create({
    data: { username: 'suda', email: 'suda@company.com', password_hash: passwordHash, first_name: 'สุดา', last_name: 'วงศ์ศรี', role_id: employeeRole.id, department_id: deptAcc.id, position_id: posStaff.id, is_active: true, is_deleted: false }
  });

  const userNapa = await prisma.user.create({
    data: { username: 'napa', email: 'napa@company.com', password_hash: passwordHash, first_name: 'นภา', last_name: 'สุขใจ', role_id: employeeRole.id, department_id: deptHR.id, position_id: posStaff.id, is_active: true, is_deleted: false }
  });

  // 3.3 Managers
  const userKittisak = await prisma.user.create({
    data: { username: 'kittisak', email: 'kittisak@company.com', password_hash: passwordHash, first_name: 'กิตติศักดิ์', last_name: 'พรหมมา', role_id: managerRole.id, department_id: deptProc.id, position_id: posSupervisor.id, is_active: true, is_deleted: false }
  });

  const userManager01 = await prisma.user.create({
    data: { username: 'manager01', email: 'manager01@company.com', password_hash: passwordHash, first_name: 'วิภา', last_name: 'รักดี', role_id: managerRole.id, department_id: deptWH.id, position_id: posSupervisor.id, is_active: true, is_deleted: false }
  });

  // 3.4 Executive
  const userPrasert = await prisma.user.create({
    data: { username: 'prasert', email: 'prasert@company.com', password_hash: passwordHash, first_name: 'ประเสริฐ', last_name: 'มีสุข', role_id: execRole.id, department_id: deptIT.id, position_id: posExecutive.id, is_active: true, is_deleted: false }
  });

  const employees = [userSomchai, userSuda, userNapa];
  const managers = [userKittisak, userManager01];
  const executives = [userPrasert];

  // ==========================================
  // 4. DOCUMENT TYPES & APPROVAL MATRIX
  // ==========================================
  const dtPR = await prisma.documentType.upsert({ where: { prefix: 'PR' }, update: {}, create: { type_name: 'ใบขอซื้อ (PR)', prefix: 'PR' } });
  const dtPO = await prisma.documentType.upsert({ where: { prefix: 'PO' }, update: {}, create: { type_name: 'ใบสั่งซื้อ (PO)', prefix: 'PO' } });
  const dtBK = await prisma.documentType.upsert({ where: { prefix: 'BK' }, update: {}, create: { type_name: 'บันทึกข้อความ (BK)', prefix: 'BK' } });
  const dtDOC = await prisma.documentType.upsert({ where: { prefix: 'DOC' }, update: {}, create: { type_name: 'เอกสารทั่วไป (DOC)', prefix: 'DOC' } });

  await prisma.runningNumber.updateMany({ data: { current_number: 1 } });

  await prisma.approvalMatrix.createMany({
    data: [
      { document_type_id: dtPR.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtPR.id, step_order: 2, required_role_id: execRole.id },
      { document_type_id: dtPO.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtPO.id, step_order: 2, required_role_id: execRole.id },
      { document_type_id: dtBK.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtDOC.id, step_order: 1, required_role_id: managerRole.id },
    ],
  });

  // Persisted documents must originate from the application or validated fixtures.
  for (const type of [dtPR, dtPO, dtBK, dtDOC]) {
    await prisma.runningNumber.upsert({
      where: { document_type_id: type.id }, update: {},
      create: { document_type_id: type.id, prefix: type.prefix, year_format: 'YYYY', padding_length: 4, current_number: 0 },
    });
  }
  console.log('Master data initialized. Register signatures before preparing document fixtures.');

}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
