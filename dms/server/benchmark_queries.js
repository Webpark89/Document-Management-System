const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.time('findMany-50-full');
  const docs = await prisma.document.findMany({
    take: 50,
    include: {
      type: true,
      creator: { include: { department: true } },
      pr_form: true,
      po_form: true,
      bk_form: true,
      versions: {
        select: {
          id: true,
          document_id: true,
          version_number: true,
          file_size: true,
          file_extension: true,
          form_data: true,
          uploaded_by_id: true,
          remarks: true,
          created_at: true,
          updated_at: true,
          uploaded_by: true,
        },
        orderBy: { version_number: 'desc' },
        take: 1,
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
    orderBy: { created_at: 'desc' },
  });
  console.timeEnd('findMany-50-full');
  console.log('Fetched docs:', docs.length);

  // Test isolating each relation
  console.time('findMany-50-no-versions');
  await prisma.document.findMany({
    take: 50,
    include: {
      type: true,
      creator: { include: { department: true } },
      pr_form: true,
      po_form: true,
      bk_form: true,
      workflow: {
        include: {
          steps: {
            include: { approver: { include: { role: true } } },
            orderBy: { step_order: 'asc' },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });
  console.timeEnd('findMany-50-no-versions');

  console.time('findMany-50-no-workflow');
  await prisma.document.findMany({
    take: 50,
    include: {
      type: true,
      creator: { include: { department: true } },
      pr_form: true,
      po_form: true,
      bk_form: true,
    },
    orderBy: { created_at: 'desc' },
  });
  console.timeEnd('findMany-50-no-workflow');

  console.time('findMany-50-bare');
  await prisma.document.findMany({
    take: 50,
    orderBy: { created_at: 'desc' },
  });
  console.timeEnd('findMany-50-bare');
}

run().catch(console.error).finally(() => prisma.$disconnect());
