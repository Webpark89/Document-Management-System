const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.findUnique({ where: { name: 'Administrator' } });
  if (!adminRole) {
    console.log("Admin role not found!");
    return;
  }

  const permsToGrant = [
    { module: 'submissions', itemKey: 'view_all', action: 'view' },
    { module: 'approvals', itemKey: 'view_all', action: 'view' },
    { module: 'document', itemKey: 'view_all', action: 'view' }
  ];

  for (const perm of permsToGrant) {
    const permString = `${perm.module}.${perm.itemKey}`;
    const p = await prisma.permission.upsert({
      where: { module_action: { module: permString, action: perm.action } },
      update: {},
      create: { module: permString, action: perm.action }
    });

    await prisma.rolePermission.upsert({
      where: { role_id_permission_id: { role_id: adminRole.id, permission_id: p.id } },
      update: {},
      create: { role_id: adminRole.id, permission_id: p.id }
    });
    console.log(`Granted ${permString}:${perm.action} to Administrator`);
  }
}

main().then(() => prisma.$disconnect());
