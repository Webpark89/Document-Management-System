import { PrismaClient, DocumentStatus, WorkflowStatus, AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding PostgreSQL database with 25 realistic mock documents...');

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

  const posStaff = await prisma.position.upsert({ where: { name: 'พนักงาน' }, update: { level: 'L1' }, create: { name: 'พนักงาน', level: 'L1' } });
  const posSupervisor = await prisma.position.upsert({ where: { name: 'หัวหน้าแผนก' }, update: { level: 'L2' }, create: { name: 'หัวหน้าแผนก', level: 'L2' } });
  const posManager = await prisma.position.upsert({ where: { name: 'ผู้จัดการฝ่าย' }, update: { level: 'L3' }, create: { name: 'ผู้จัดการฝ่าย', level: 'L3' } });
  const posDirector = await prisma.position.upsert({ where: { name: 'ผู้อำนวยการ' }, update: { level: 'L4' }, create: { name: 'ผู้อำนวยการ', level: 'L4' } });
  const posExecutive = await prisma.position.upsert({ where: { name: 'ผู้บริหาร' }, update: { level: 'L5' }, create: { name: 'ผู้บริหาร', level: 'L5' } });

  // ==========================================
  // 4. USERS
  // ==========================================
  const passwordHash = await bcrypt.hash('folk2546', 10);

  const adminUser = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: { username: 'admin', email: 'admin@company.com', password_hash: passwordHash, first_name: 'ระบบบำรุงรักษา', last_name: 'ผู้ดูแลระบบ', role_id: adminRole.id, department_id: deptIT.id, position_id: posManager.id, is_active: true, is_deleted: false },
  });

  const userSomchai = await prisma.user.upsert({
    where: { email: 'somchai@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: { username: 'somchai', email: 'somchai@company.com', password_hash: passwordHash, first_name: 'สมชาย', last_name: 'ใจดี', role_id: managerRole.id, department_id: deptProc.id, position_id: posManager.id, is_active: true, is_deleted: false },
  });

  const userSuda = await prisma.user.upsert({
    where: { email: 'suda@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: { username: 'suda', email: 'suda@company.com', password_hash: passwordHash, first_name: 'สุดา', last_name: 'วงศ์ศรี', role_id: employeeRole.id, department_id: deptAcc.id, position_id: posStaff.id, is_active: true, is_deleted: false },
  });

  const userWipa = await prisma.user.upsert({
    where: { email: 'wipa@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: { username: 'manager01', email: 'wipa@company.com', password_hash: passwordHash, first_name: 'วิภา', last_name: 'รักดี', role_id: managerRole.id, department_id: deptWH.id, position_id: posSupervisor.id, is_active: true, is_deleted: false },
  });

  const userPrasert = await prisma.user.upsert({
    where: { email: 'prasert@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: { username: 'prasert', email: 'prasert@company.com', password_hash: passwordHash, first_name: 'ประเสริฐ', last_name: 'มีสุข', role_id: execRole.id, department_id: deptIT.id, position_id: posExecutive.id, is_active: true, is_deleted: false },
  });

  const userNapa = await prisma.user.upsert({
    where: { email: 'napa@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: { username: 'napa', email: 'napa@company.com', password_hash: passwordHash, first_name: 'นภา', last_name: 'สุขใจ', role_id: employeeRole.id, department_id: deptHR.id, position_id: posStaff.id, is_active: true, is_deleted: false },
  });

  const userKittisak = await prisma.user.upsert({
    where: { email: 'kittisak@company.com' },
    update: { password_hash: passwordHash, is_active: true, is_deleted: false },
    create: { username: 'kittisak', email: 'kittisak@company.com', password_hash: passwordHash, first_name: 'กิตติศักดิ์', last_name: 'พรหมมา', role_id: execRole.id, department_id: deptProd.id, position_id: posDirector.id, is_active: true, is_deleted: false },
  });

  const allUsers = [adminUser, userSomchai, userSuda, userWipa, userPrasert, userNapa, userKittisak];

  // ==========================================
  // 5. DOCUMENT TYPES
  // ==========================================
  const dtPR = await prisma.documentType.upsert({ where: { prefix: 'PR' }, update: {}, create: { type_name: 'ใบขอซื้อ (PR)', prefix: 'PR' } });
  const dtPO = await prisma.documentType.upsert({ where: { prefix: 'PO' }, update: {}, create: { type_name: 'ใบสั่งซื้อ (PO)', prefix: 'PO' } });
  const dtBK = await prisma.documentType.upsert({ where: { prefix: 'BK' }, update: {}, create: { type_name: 'บันทึกข้อความ (BK)', prefix: 'BK' } });

  const typesMap = { PR: dtPR, PO: dtPO, BK: dtBK };

  // ==========================================
  // 6. RUNNING NUMBERS (Reset)
  // ==========================================
  await prisma.runningNumber.updateMany({ data: { current_number: 1 } }); // Will increment below

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
      { document_type_id: dtBK.id, step_order: 1, required_role_id: managerRole.id },
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
  // 8. GENERATE 25 DOCUMENTS
  // ==========================================

  const docDataList = [];
  const titles = [
    'ขอซื้ออุปกรณ์คอมพิวเตอร์', 'สั่งซื้อวัตถุดิบการผลิต', 'บันทึกข้อความขออนุมัติจัดกิจกรรม',
    'ขอซื้อเครื่องเขียนประจำเดือน', 'สั่งซื้ออะไหล่ซ่อมบำรุง', 'บันทึกแจ้งเปลี่ยนเวลาเข้างาน',
    'ขอซื้อเฟอร์นิเจอร์สำนักงานใหม่', 'สั่งซื้อบริการ Cloud Server', 'บันทึกรายงานผลประกอบการ',
    'ขอซื้ออุปกรณ์ทำความสะอาด', 'สั่งซื้อเครื่องดื่มรับรองลูกค้า', 'บันทึกขออนุมัติค่าเดินทาง',
    'ขอซื้อกระดาษชำระ', 'สั่งซื้อแอร์สำนักงาน', 'บันทึกขอจัดการอบรมพนักงาน',
    'ขอซื้อหมึกพิมพ์', 'สั่งซื้อของขวัญปีใหม่พนักงาน', 'บันทึกนโยบายบริษัทใหม่',
    'ขอซื้อเครื่องมือช่าง', 'สั่งซื้อบริการทำความสะอาด', 'บันทึกแต่งตั้งคณะกรรมการ',
    'ขอซื้ออุปกรณ์พยาบาล', 'สั่งซื้อเครื่องสแกนนิ้วมือ', 'บันทึกขออนุมัติเบิกค่าล่วงเวลา',
    'ขอซื้อโทรศัพท์มือถือส่วนกลาง'
  ];

  let prCount = 1;
  let poCount = 1;
  let bkCount = 1;

  for (let i = 0; i < 25; i++) {
    const isPR = i % 3 === 0;
    const isPO = i % 3 === 1;
    const typeAlias = isPR ? 'PR' : (isPO ? 'PO' : 'BK');
    const docType = typesMap[typeAlias];
    
    let docNum = '';
    if (isPR) docNum = `PR-2026-${String(prCount++).padStart(4, '0')}`;
    if (isPO) docNum = `PO-2026-${String(poCount++).padStart(4, '0')}`;
    if (!isPR && !isPO) docNum = `BK-2026-${String(bkCount++).padStart(4, '0')}`;

    const statuses = [DocumentStatus.Approved, DocumentStatus.Pending, DocumentStatus.Returned, DocumentStatus.Rejected, DocumentStatus.Draft];
    // Distribution: 10 Approved, 8 Pending, 3 Returned, 2 Rejected, 2 Draft
    let targetStatus: DocumentStatus = DocumentStatus.Pending;
    if (i < 10) targetStatus = DocumentStatus.Approved;
    else if (i < 18) targetStatus = DocumentStatus.Pending;
    else if (i < 21) targetStatus = DocumentStatus.Returned;
    else if (i < 23) targetStatus = DocumentStatus.Rejected;
    else targetStatus = DocumentStatus.Draft;

    const creator = allUsers[i % allUsers.length];
    
    // Timeline logic
    const createdDt = new Date(2026, 7, 1 + i, 9, 0, 0); // August 1st onwards
    const submittedDt = targetStatus !== DocumentStatus.Draft ? new Date(createdDt.getTime() + 1000 * 60 * 30) : createdDt;
    let updatedDt = new Date(createdDt.getTime() + 1000 * 60 * 60 * 24);

    const workflowStepsCount = isPR ? 3 : (isPO ? 2 : 1);
    const stepsData: any[] = [];
    let currentStepIndex = 1;
    let wfStatus: WorkflowStatus = WorkflowStatus.Pending;

    const approvers = [userSomchai, userPrasert, adminUser];

    if (targetStatus === DocumentStatus.Draft) {
      wfStatus = WorkflowStatus.Pending;
    } else if (targetStatus === DocumentStatus.Approved) {
      wfStatus = WorkflowStatus.Approved;
      currentStepIndex = workflowStepsCount;
      for (let s = 1; s <= workflowStepsCount; s++) {
        stepsData.push({
          step_order: s,
          approver_id: approvers[s - 1].id,
          status: WorkflowStatus.Approved,
          action_date: new Date(submittedDt!.getTime() + 1000 * 60 * 60 * 2 * s),
          comment: 'อนุมัติ',
          signature_applied: true
        });
      }
      updatedDt = new Date(submittedDt!.getTime() + 1000 * 60 * 60 * 2 * workflowStepsCount);
    } else if (targetStatus === DocumentStatus.Pending) {
      // 1st step approved, rest pending
      currentStepIndex = 2;
      wfStatus = WorkflowStatus.Pending;
      for (let s = 1; s <= workflowStepsCount; s++) {
        if (s === 1 && workflowStepsCount > 1) {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Approved,
            action_date: new Date(submittedDt!.getTime() + 1000 * 60 * 60 * 2),
            comment: 'เห็นควรอนุมัติ',
            signature_applied: true
          });
          updatedDt = new Date(submittedDt!.getTime() + 1000 * 60 * 60 * 2);
        } else {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Pending
          });
        }
      }
    } else if (targetStatus === DocumentStatus.Returned) {
      wfStatus = WorkflowStatus.Rejected;
      currentStepIndex = 2; // Assuming returned at step 2
      stepsData.push({
        step_order: 1,
        approver_id: approvers[0].id,
        status: WorkflowStatus.Approved,
        action_date: new Date(submittedDt!.getTime() + 1000 * 60 * 60),
        comment: 'ผ่านขั้นแรก',
        signature_applied: true
      });
      if (workflowStepsCount > 1) {
        stepsData.push({
          step_order: 2,
          approver_id: approvers[1].id,
          status: WorkflowStatus.Rejected,
          action_date: new Date(submittedDt!.getTime() + 1000 * 60 * 60 * 2),
          comment: 'ข้อมูลไม่ครบ ส่งกลับไปแก้ (Return)',
          return_to_step: 1
        });
      }
      updatedDt = new Date(submittedDt!.getTime() + 1000 * 60 * 60 * 2);
    } else if (targetStatus === DocumentStatus.Rejected) {
      wfStatus = WorkflowStatus.Rejected;
      currentStepIndex = 1;
      stepsData.push({
        step_order: 1,
        approver_id: approvers[0].id,
        status: WorkflowStatus.Rejected,
        action_date: new Date(submittedDt!.getTime() + 1000 * 60 * 60),
        comment: 'ไม่อนุมัติ (Cancel)'
      });
      for(let s = 2; s <= workflowStepsCount; s++) {
         stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Pending
         });
      }
      updatedDt = new Date(submittedDt!.getTime() + 1000 * 60 * 60);
    }

    // Prepare forms based on type
    let pr_form: any = undefined;
    let po_form: any = undefined;
    let bk_form: any = undefined;

    if (isPR) {
      pr_form = {
        create: {
          requester_id: creator.id,
          department_id: deptHR.id,
          purpose: titles[i],
          total_amount: 1000 * (i + 1),
          requested_date: createdDt,
          items: {
            create: [
              { item_name: 'สินค้าทดสอบ', quantity: 10, unit: 'ชิ้น', unit_price: 100 * (i+1), total_price: 1000 * (i+1) }
            ]
          }
        }
      };
    } else if (isPO) {
      po_form = {
        create: {
          vendor_name: 'บริษัท ซัพพลายเออร์ ' + i,
          total_amount: 5000 * (i + 1),
          items: {
            create: [
               { item_name: 'อุปกรณ์ A', quantity: 5, unit: 'กล่อง', unit_price: 1000 * (i+1), total_price: 5000 * (i+1) }
            ]
          }
        }
      };
    } else {
      bk_form = {
        create: {
          subject: titles[i],
          detail: 'รายละเอียดการบันทึกข้อความสำหรับทดสอบ ' + i,
          department_id: deptIT.id
        }
      };
    }

    const doc = await prisma.document.create({
      data: {
        doc_number: docNum,
        title: titles[i],
        type_id: docType.id,
        creator_id: creator.id,
        status: targetStatus,
        created_at: createdDt,
        updated_at: updatedDt,
        pr_form: pr_form,
        po_form: po_form,
        bk_form: bk_form,
        workflow: targetStatus !== DocumentStatus.Draft ? {
          create: {
            total_steps: workflowStepsCount,
            current_step: currentStepIndex,
            status: wfStatus,
            steps: {
              create: stepsData
            }
          }
        } : undefined
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
        remarks: 'เอกสารร่างแรก / ต้นฉบับ',
        created_at: createdDt,
      }
    });

    if (targetStatus === DocumentStatus.Returned) {
       await prisma.documentVersion.create({
          data: {
             document_id: doc.id,
             version_number: 2,
             file_size: '600 KB',
             file_extension: 'pdf',
             uploaded_by_id: creator.id,
             remarks: 'เอกสารอัปเดตหลังจากถูกตีกลับแก้ไข',
             created_at: updatedDt,
          }
       });
    }

    if (targetStatus === DocumentStatus.Approved) {
       await prisma.documentVersion.create({
          data: {
             document_id: doc.id,
             version_number: 2,
             file_size: '800 KB',
             file_extension: 'pdf',
             uploaded_by_id: adminUser.id,
             remarks: 'เอกสารฉบับสมบูรณ์ ประทับลายเซ็นครบถ้วน ระบบสร้างอัตโนมัติ',
             created_at: updatedDt,
          }
       });
    }

    // Notifications
    if (targetStatus !== DocumentStatus.Draft) {
       await prisma.notification.create({
          data: {
             user_id: creator.id,
             document_id: doc.id,
             message: `แจ้งเตือน: สถานะเอกสาร ${docNum} ล่าสุดคือ ${targetStatus}`,
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
          details: { state: 'Created' },
          ip_address: '127.0.0.1',
          created_at: createdDt
       }
    });

  }

  // Update Running Numbers
  await prisma.runningNumber.update({ where: { document_type_id: dtPR.id }, data: { current_number: prCount } });
  await prisma.runningNumber.update({ where: { document_type_id: dtPO.id }, data: { current_number: poCount } });
  await prisma.runningNumber.update({ where: { document_type_id: dtBK.id }, data: { current_number: bkCount } });

  console.log('✅ Complete system seed finished! Generated 25 realistic mock documents with full timelines and histories.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
