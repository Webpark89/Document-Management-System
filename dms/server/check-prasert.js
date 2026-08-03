const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ where: { first_name: { contains: 'ประเสริฐ' } } });
  console.log("USERS:", users);
  for (const user of users) {
    const steps = await prisma.workflowStep.findMany({ where: { approver_id: user.id } });
    console.log("STEPS FOR", user.id, steps);
    
    // Also check what roles the steps without approvers have
    const pendingSteps = await prisma.workflowStep.findMany({ where: { status: 'Pending' } });
    console.log("ALL PENDING STEPS", pendingSteps);
  }
}
run().finally(() => prisma.$disconnect());
