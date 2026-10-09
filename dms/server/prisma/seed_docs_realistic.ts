import { PrismaClient, DocumentStatus, WorkflowStatus, AuditAction } from '@prisma/client';

const prisma = new PrismaClient();

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🚀 Wiping old document data...');

  // 1. Wipe Document data only
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

  console.log('✅ Old document data wiped successfully.');
  console.log('🚀 Fetching master data...');

  // 2. Fetch Master Data (Users, Departments, Types)
  const users = await prisma.user.findMany({ include: { department: true, position: true, role: true } });
  const departments = await prisma.department.findMany();
  const documentTypes = await prisma.documentType.findMany();

  if (users.length === 0 || departments.length === 0 || documentTypes.length === 0) {
    console.error('❌ Missing Master Data (Users, Departments, or Document Types). Please run standard seed first.');
    process.exit(1);
  }

  // Get Admin/Executives for final approval
  const executives = users.filter(u => u.role?.name === 'Executive' || u.role?.name === 'Administrator');
  const managers = users.filter(u => u.role?.name === 'Manager');
  const employees = users.filter(u => u.role?.name === 'Employee' || u.role?.name === 'Manager');

  if (executives.length === 0) executives.push(users[0]);
  if (managers.length === 0) managers.push(users[0]);

  const prTitles = [
    "PR for New Computers",
    "Monthly Office Supplies",
    "Software Licenses for Design Team",
    "Additional Office Desks and Chairs",
    "New Database Server",
    "Printer Paper and Ink",
    "Projector for Meeting Room",
    "Employee Uniforms",
    "Monthly Cleaning Supplies",
    "Drinking Water for Office"
  ];

  const poTitles = [
    "PO for 10 New Computers",
    "PO for AC Maintenance Service",
    "PO for Construction Materials - Project A",
    "PO for Office Cleaning Service - 1 Year",
    "PO for Cloud Hosting Services",
    "PO for Office Furniture",
    "PO for Network Routers and Switches",
    "PO for Printers and Scanners",
    "PO for New Year Premium Gifts",
    "PO for Marketing Ads Q3"
  ];

  const bkTitles = [
    "Q2 Operations Summary Report",
    "Budget Disbursement Report",
    "Department Restructuring Notice",
    "Energy Cost Reduction Proposal",
    "Monthly Meeting Summary",
    "Next Year Marketing Plan Approval",
    "Operations Issues and Obstacles Report",
    "Welfare Improvement Suggestions",
    "Seminar Invitation Notice",
    "Annual Employee Evaluation Summary"
  ];

  let prCount = 0;
  let poCount = 0;
  let bkCount = 0;

  const statuses = [
    DocumentStatus.Approved,
    DocumentStatus.Approved,
    DocumentStatus.Approved,
    DocumentStatus.Pending,
    DocumentStatus.Pending,
    DocumentStatus.Draft,
    DocumentStatus.Returned,
    DocumentStatus.Rejected,
    DocumentStatus.Cancelled
  ];

  const NUM_DOCS = 120; // Increased documents to generate
  console.log(`🚀 Generating ${NUM_DOCS} realistic mock documents...`);

  const now = new Date();
  const past3Months = new Date();
  past3Months.setMonth(now.getMonth() - 3);

  for (let i = 0; i < NUM_DOCS; i++) {
    const creator = employees[getRandomInt(0, employees.length - 1)];
    const docType = documentTypes[getRandomInt(0, documentTypes.length - 1)];
    const targetStatus = statuses[getRandomInt(0, statuses.length - 1)];
    
    let title = "";
    let docNum = "";

    if (docType.prefix === 'PR') {
      prCount++;
      title = prTitles[getRandomInt(0, prTitles.length - 1)];
      docNum = `PR-${now.getFullYear()}-${String(prCount).padStart(4, '0')}`;
    } else if (docType.prefix === 'PO') {
      poCount++;
      title = poTitles[getRandomInt(0, poTitles.length - 1)];
      docNum = `PO-${now.getFullYear()}-${String(poCount).padStart(4, '0')}`;
    } else {
      bkCount++;
      title = bkTitles[getRandomInt(0, bkTitles.length - 1)];
      docNum = `BK-${now.getFullYear()}-${String(bkCount).padStart(4, '0')}`;
    }

    const createdDt = getRandomDate(past3Months, new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000));
    const updatedDt = getRandomDate(createdDt, now);
    const approvedDt = targetStatus === DocumentStatus.Approved ? updatedDt : null;

    // Workflow setup
    const workflowStepsCount = docType.prefix === 'BK' ? 1 : 2;
    const assignedManager = managers[getRandomInt(0, managers.length - 1)];
    const assignedExec = executives[getRandomInt(0, executives.length - 1)];
    let approvers = [assignedManager];
    if (workflowStepsCount > 1) approvers.push(assignedExec);

    let stepsData: any[] = [];
    let wfStatus: WorkflowStatus = WorkflowStatus.Pending;
    let currentStepIndex = 1;

    if (targetStatus === DocumentStatus.Approved) {
      wfStatus = WorkflowStatus.Approved;
      currentStepIndex = workflowStepsCount;
      for (let s = 1; s <= workflowStepsCount; s++) {
        stepsData.push({
          step_order: s,
          approver_id: approvers[s - 1].id,
          status: WorkflowStatus.Approved,
          action_date: getRandomDate(createdDt, approvedDt!),
          comment: s === 1 ? 'Checked and verified' : 'Approved',
          signature_applied: true
        });
      }
    } else if (targetStatus === DocumentStatus.Pending) {
      wfStatus = WorkflowStatus.Pending;
      currentStepIndex = getRandomInt(1, workflowStepsCount);
      for (let s = 1; s <= workflowStepsCount; s++) {
        if (s < currentStepIndex) {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Approved,
            action_date: getRandomDate(createdDt, updatedDt),
            comment: 'Looks good',
            signature_applied: true
          });
        } else {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Pending
          });
        }
      }
    } else if (targetStatus === DocumentStatus.Returned || targetStatus === DocumentStatus.Rejected) {
      wfStatus = WorkflowStatus.Rejected;
      currentStepIndex = getRandomInt(1, workflowStepsCount);
      for (let s = 1; s <= workflowStepsCount; s++) {
        if (s < currentStepIndex) {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Approved,
            action_date: getRandomDate(createdDt, updatedDt),
            comment: 'Looks good',
            signature_applied: true
          });
        } else if (s === currentStepIndex) {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: wfStatus,
            action_date: updatedDt,
            comment: targetStatus === DocumentStatus.Returned ? 'Incomplete info, please revise' : 'Budget insufficient, rejected'
          });
        } else {
          stepsData.push({
            step_order: s,
            approver_id: approvers[s - 1].id,
            status: WorkflowStatus.Pending
          });
        }
      }
    } else { // Draft or Cancelled
      wfStatus = WorkflowStatus.Pending;
    }

    let pr_form: any = undefined;
    let po_form: any = undefined;
    let bk_form: any = undefined;

    if (docType.prefix === 'PR') {
      pr_form = {
        create: {
          requester_id: creator.id,
          department_id: creator.department_id || departments[0].id,
          purpose: title,
          total_amount: getRandomInt(1000, 50000),
          requested_date: createdDt,
          items: {
            create: Array.from({ length: getRandomInt(1, 5) }).map((_, idx) => {
              const qty = getRandomInt(1, 10);
              const price = getRandomInt(100, 5000);
              return { item_name: `Item Reference ${idx+1}`, quantity: qty, unit: 'pcs', unit_price: price, total_price: qty * price };
            })
          }
        }
      };
    } else if (docType.prefix === 'PO') {
      po_form = {
        create: {
          vendor_name: 'Vendor Public Co., Ltd.',
          total_amount: getRandomInt(5000, 100000),
          items: {
            create: Array.from({ length: getRandomInt(1, 3) }).map((_, idx) => {
              const qty = getRandomInt(1, 10);
              const price = getRandomInt(500, 10000);
              return { item_name: `Order Item ${idx+1}`, quantity: qty, unit: 'box', unit_price: price, total_price: qty * price };
            })
          }
        }
      };
    } else {
      bk_form = {
        create: {
          subject: title,
          detail: 'Detailed memo content for executive review...',
          department_id: creator.department_id || departments[0].id
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
        approved_at: approvedDt,
        pr_form: pr_form,
        po_form: po_form,
        bk_form: bk_form,
        ...(targetStatus !== DocumentStatus.Draft && targetStatus !== DocumentStatus.Cancelled ? {
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
        } : {})
      }
    });

    // Version History
    const numVersions = getRandomInt(1, 3);
    for (let v = 1; v <= numVersions; v++) {
      await prisma.documentVersion.create({
        data: {
          document_id: doc.id,
          version_number: v,
          file_size: `${getRandomInt(200, 900)} KB`,
          file_extension: 'pdf',
          uploaded_by_id: creator.id,
          remarks: v === 1 ? 'Draft version' : `Revision ${v-1}`,
          created_at: new Date(createdDt.getTime() + v * 3600000),
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

    if (targetStatus === DocumentStatus.Approved) {
      await prisma.auditLog.create({
         data: {
            user_id: approvers[approvers.length-1].id,
            action: AuditAction.Approve,
            module: 'Document',
            target_id: doc.id,
            details: { state: 'Approved', message: 'Document fully approved' },
            ip_address: '127.0.0.1',
            created_at: approvedDt!
         }
      });
    }

    if (i % 10 === 0) process.stdout.write('⏳ ');
  }
  
  console.log('\n✅ Created 120 realistic documents across all statuses and departments.');

  // Update running numbers
  const dtPR = documentTypes.find(d => d.prefix === 'PR');
  const dtPO = documentTypes.find(d => d.prefix === 'PO');
  const dtBK = documentTypes.find(d => d.prefix === 'BK');
  
  if (dtPR) await prisma.runningNumber.upsert({ where: { document_type_id: dtPR.id }, update: { current_number: prCount }, create: { document_type_id: dtPR.id, current_number: prCount, prefix: 'PR', year_format: 'YYYYMM', padding_length: 4, last_reset_year: new Date().getFullYear() } });
  if (dtPO) await prisma.runningNumber.upsert({ where: { document_type_id: dtPO.id }, update: { current_number: poCount }, create: { document_type_id: dtPO.id, current_number: poCount, prefix: 'PO', year_format: 'YYYYMM', padding_length: 4, last_reset_year: new Date().getFullYear() } });
  if (dtBK) await prisma.runningNumber.upsert({ where: { document_type_id: dtBK.id }, update: { current_number: bkCount }, create: { document_type_id: dtBK.id, current_number: bkCount, prefix: 'BK', year_format: 'YYYYMM', padding_length: 4, last_reset_year: new Date().getFullYear() } });

  console.log('✅ Updated Running Numbers successfully.');
  console.log('🎉 REALISTIC DATABASE SEED COMPLETED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
