const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  console.time('findMany-150-lean');
  const docs = await prisma.document.findMany({
    take: 150,
    include: {
      type: { select: { prefix: true, type_name: true } },
      creator: { select: { id: true, first_name: true, last_name: true, department: { select: { name: true } } } },
      pr_form: { select: { total_amount: true } },
      po_form: { select: { total_amount: true } },
      bk_form: { select: { id: true } },
      workflow: {
        select: {
          current_step: true,
          status: true,
          steps: {
            select: {
              step_order: true,
              status: true,
              approver: {
                select: { id: true, first_name: true, last_name: true }
              }
            },
            orderBy: { step_order: 'asc' }
          }
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });
  console.timeEnd('findMany-150-lean');
  console.log('Docs fetched:', docs.length);
}
run().catch(console.error).finally(() => prisma.$disconnect());
