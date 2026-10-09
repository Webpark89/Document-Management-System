const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  console.time('add-index');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_workflow_steps_approver_id ON workflow_steps(approver_id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_workflows_document_id ON workflows(document_id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_pr_forms_document_id ON pr_forms(document_id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_po_forms_document_id ON po_forms(document_id);');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS idx_bk_forms_document_id ON bk_forms(document_id);');
  console.timeEnd('add-index');
}
run().finally(() => prisma.$disconnect());
