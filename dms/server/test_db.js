const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const docs = await prisma.document.findMany({ select: { id: true } });
  for (const d of docs) {
    try {
      await prisma.document.findUnique({
        where: { id: d.id },
        include: { type: true, creator: { include: { department: true } }, pr_form: true, po_form: true, bk_form: true, versions: true, workflow: { include: { steps: { include: { approver: { include: { role: true } } } } } } }
      });
    } catch (e) {
      console.error('Error on doc', d.id, e.message);
    }
  }
  console.log("Done checking documents.");
}
run();
