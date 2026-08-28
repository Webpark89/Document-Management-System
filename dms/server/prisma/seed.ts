import { PrismaClient, DocumentStatus, WorkflowStatus, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding PostgreSQL database with tailored mock data...');

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
    ['dashboard.charts', 'view'],
    ['dashboard.date_filter', 'view'],
    ['dashboard.my_pending_view', 'view'],
    ['dashboard.recent_docs', 'view'],
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
    ['dashboard.pending_approvals_view', 'view'],
    ['dashboard.scope_dropdown', 'view'],
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

  await prisma.runningNumber.updateMany({ data: { current_number: 1 } });

  await prisma.approvalMatrix.createMany({
    data: [
      { document_type_id: dtPR.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtPR.id, step_order: 2, required_role_id: execRole.id },
      { document_type_id: dtPO.id, step_order: 1, required_role_id: managerRole.id },
      { document_type_id: dtPO.id, step_order: 2, required_role_id: execRole.id },
      { document_type_id: dtBK.id, step_order: 1, required_role_id: managerRole.id },
    ],
  });

  // ==========================================
  // 5. GENERATE DOCUMENTS MOCK DATA
  // ==========================================
  // Create 20 Documents:
  // 8 Approved (Visible in Archive)
  // 12 Pending (Spread across managers and executives so everyone has work)

  let prCount = 1;
  let poCount = 1;
  let bkCount = 1;

  for (let i = 0; i < 20; i++) {
    const isApproved = i < 8; // 8 Approved documents
    const docType = i % 3 === 0 ? dtPR : (i % 3 === 1 ? dtPO : dtBK);
    
    let docNum = '';
    if (docType.prefix === 'PR') docNum = `PR-2026-${String(prCount++).padStart(4, '0')}`;
    if (docType.prefix === 'PO') docNum = `PO-2026-${String(poCount++).padStart(4, '0')}`;
    if (docType.prefix === 'BK') docNum = `BK-2026-${String(bkCount++).padStart(4, '0')}`;

    const prTitles = [
      "ขออนุมัติซื้อคอมพิวเตอร์และหน้าจอสำหรับแผนก IT",
      "ขออนุมัติจัดซื้อเครื่องพิมพ์เลเซอร์สีความละเอียดสูง",
      "ขอจัดซื้อวัสดุสิ้นเปลืองและอุปกรณ์สำนักงานประจำไตรมาส",
      "ขออนุมัติซื้อเก้าอี้เพื่อสุขภาพสำหรับพนักงานบัญชี",
      "ขอจัดซื้อเครื่องปรับอากาศสำหรับห้องประชุมใหญ่",
      "ขอจัดซื้อสิทธิ์การใช้งานโปรแกรมลิขสิทธิ์ Adobe Creative Cloud",
      "ขออนุมัติว่าจ้างบริการซ่อมบำรุงระบบไฟฟ้าอาคาร"
    ];
    const poTitles = [
      "สั่งซื้อเครื่องคอมพิวเตอร์ Dell Vostro 3910 พร้อมหน้าจอ",
      "สั่งซื้อกระดาษ A4 Double A 80 แกรม จำนวน 50 กล่อง",
      "สั่งซื้อตู้เก็บเอกสารเหล็ก 4 ลิ้นชัก จำนวน 5 ตู้",
      "สั่งซื้อตู้เย็นสำหรับห้องพักพนักงาน ขนาด 7.4 คิว",
      "สั่งซื้อเครื่องสำรองไฟฟ้า (UPS) ขนาด 1000VA",
      "สั่งซื้อสิทธิ์การใช้งานโปรแกรม Microsoft 365 Business Standard",
      "สั่งซื้อหลอดไฟ LED สำหรับติดตั้งภายในสำนักงาน"
    ];
    const bkTitles = [
      "ขออนุมัติเดินทางไปปฏิบัติงานติดตั้งระบบ ณ สาขาต่างจังหวัด",
      "แจ้งการประชุมซักซ้อมความเข้าใจมาตรการรักษาความปลอดภัยข้อมูล",
      "ขอความร่วมมือรายงานผลการประเมินการปฏิบัติงานประจำครึ่งปีแรก",
      "ขออนุมัติจัดกิจกรรมสัมมนาเพื่อสร้างความสัมพันธ์ในองค์กร",
      "แจ้งปรับปรุงระบบเครือข่ายภายในสำนักงานในช่วงวันหยุดสุดสัปดาห์",
      "ขอส่งตัวแทนเข้าร่วมการฝึกอบรมหลักสูตรการบริหารความเสี่ยง"
    ];

    let title = '';
    if (docType.prefix === 'PR') title = prTitles[(prCount - 1) % prTitles.length];
    else if (docType.prefix === 'PO') title = poTitles[(poCount - 1) % poTitles.length];
    else title = bkTitles[(bkCount - 1) % bkTitles.length];

    const targetStatus = isApproved ? DocumentStatus.Approved : DocumentStatus.Pending;

    const creator = employees[i % employees.length];
    
    // Assign specific managers based on doc index to ensure both get work
    const assignedManager = managers[i % managers.length];
    
    const workflowStepsCount = docType.prefix === 'BK' ? 1 : 2;
    let approvers = [assignedManager];
    if (workflowStepsCount > 1) {
      approvers.push(userPrasert); // Step 2 is executive
    }

    const createdDt = new Date(2026, 7, 1 + (i % 15), 9, 0, 0); 
    const updatedDt = new Date(createdDt.getTime() + 1000 * 60 * 60 * 24);

    let stepsData: any[] = [];
    let wfStatus: WorkflowStatus = WorkflowStatus.Pending;
    let currentStepIndex = 1;

    if (isApproved) {
      wfStatus = WorkflowStatus.Approved;
      currentStepIndex = workflowStepsCount;
      for (let s = 1; s <= workflowStepsCount; s++) {
        stepsData.push({
          step_order: s,
          approver_id: approvers[s - 1].id,
          status: WorkflowStatus.Approved,
          action_date: new Date(createdDt.getTime() + 1000 * 60 * 60 * s),
          comment: s === 1 ? 'อนุมัติเบื้องต้น' : 'อนุมัติขั้นสูงสุด',
          signature_applied: true
        });
      }
    } else {
      wfStatus = WorkflowStatus.Pending;
      // Make half of the pending docs waiting at Step 1 (Manager), half waiting at Step 2 (Executive)
      if (workflowStepsCount > 1 && i % 2 === 0) {
        // Pending at Step 2
        currentStepIndex = 2;
        stepsData.push({
          step_order: 1,
          approver_id: approvers[0].id,
          status: WorkflowStatus.Approved,
          action_date: new Date(createdDt.getTime() + 1000 * 60 * 60),
          comment: 'เห็นควรอนุมัติ ส่งต่อผู้บริหาร',
          signature_applied: true
        });
        stepsData.push({
          step_order: 2,
          approver_id: approvers[1].id,
          status: WorkflowStatus.Pending
        });
      } else {
        // Pending at Step 1
        currentStepIndex = 1;
        for (let s = 1; s <= workflowStepsCount; s++) {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Pending
          });
        }
      }
    }

    let pr_form: any = undefined;
    let po_form: any = undefined;
    let bk_form: any = undefined;

    if (docType.prefix === 'PR') {
      pr_form = {
        create: {
          requester_id: creator.id,
          department_id: creator.department_id,
          purpose: title,
          total_amount: 1000 * (i + 1),
          requested_date: createdDt,
          items: {
            create: [
              { item_name: 'สินค้าทดสอบ ' + (i+1), quantity: 10, unit: 'ชิ้น', unit_price: 100 * (i+1), total_price: 1000 * (i+1) }
            ]
          }
        }
      };
    } else if (docType.prefix === 'PO') {
      po_form = {
        create: {
          vendor_name: 'บริษัท ซัพพลายเออร์ ' + i,
          total_amount: 5000 * (i + 1),
          items: {
            create: [
               { item_name: 'อุปกรณ์ ' + i, quantity: 5, unit: 'กล่อง', unit_price: 1000 * (i+1), total_price: 5000 * (i+1) }
            ]
          }
        }
      };
    } else {
      bk_form = {
        create: {
          subject: title,
          detail: 'รายละเอียดการบันทึกข้อความสำหรับทดสอบ ' + i,
          department_id: creator.department_id
        }
      };
    }

    const doc = await prisma.document.create({
      data: {
        doc_number: docNum,
        title: title,
        type_id: docType.id,
        creator_id: creator.id,
        status: targetStatus,
        created_at: createdDt,
        updated_at: updatedDt,
        pr_form: pr_form,
        po_form: po_form,
        bk_form: bk_form,
        workflow: {
          create: {
            total_steps: workflowStepsCount,
            current_step: currentStepIndex,
            status: wfStatus,
            steps: {
              create: stepsData
            }
          }
        }
      }
    });

    // Version History
    await prisma.documentVersion.create({
      data: {
        document_id: doc.id,
        version_number: 1,
        file_size: '500 KB',
        file_extension: 'pdf',
        uploaded_by_id: creator.id,
        remarks: 'เอกสารต้นฉบับ',
        created_at: createdDt,
      }
    });

    if (isApproved) {
       await prisma.documentVersion.create({
          data: {
             document_id: doc.id,
             version_number: 2,
             file_size: '600 KB',
             file_extension: 'pdf',
             uploaded_by_id: userAdmin.id,
             remarks: 'เอกสารอนุมัติสมบูรณ์',
             created_at: updatedDt,
          }
       });
    }

    // Notifications - Notify the user who needs to act
    if (!isApproved) {
       const activeApprover = approvers[currentStepIndex - 1];
       await prisma.notification.create({
          data: {
             user_id: activeApprover.id,
             document_id: doc.id,
             message: `คุณมีเอกสารรอการอนุมัติ: ${docNum} - ${title}`,
             is_read: false,
             created_at: updatedDt
          }
       });
    } else {
       await prisma.notification.create({
          data: {
             user_id: creator.id,
             document_id: doc.id,
             message: `เอกสาร ${docNum} ของคุณได้รับการอนุมัติสมบูรณ์แล้ว`,
             is_read: false,
             created_at: updatedDt
          }
       });
    }

    // Audit logs
    await prisma.auditLog.create({
       data: {
          user_id: creator.id,
          action: AuditAction.Upload,
          module: 'Document',
          target_id: doc.id,
          details: { state: 'Created', message: 'User created document' },
          ip_address: '127.0.0.1',
          created_at: createdDt
       }
    });
  }

  await prisma.runningNumber.upsert({ where: { document_type_id: dtPR.id }, update: { current_number: prCount }, create: { document_type_id: dtPR.id, current_number: prCount, prefix: 'PR', year_format: 'YYYYMM', padding_length: 4, last_reset_year: new Date().getFullYear() } });
  await prisma.runningNumber.upsert({ where: { document_type_id: dtPO.id }, update: { current_number: poCount }, create: { document_type_id: dtPO.id, current_number: poCount, prefix: 'PO', year_format: 'YYYYMM', padding_length: 4, last_reset_year: new Date().getFullYear() } });
  await prisma.runningNumber.upsert({ where: { document_type_id: dtBK.id }, update: { current_number: bkCount }, create: { document_type_id: dtBK.id, current_number: bkCount, prefix: 'BK', year_format: 'YYYYMM', padding_length: 4, last_reset_year: new Date().getFullYear() } });

  console.log('✅ Complete system seed finished! Generated mock users and realistic documents.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
