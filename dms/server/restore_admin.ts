import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'admin';
  const passwordHash = await bcrypt.hash('folk2546', 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { username: adminUsername },
      data: { is_deleted: false, is_active: true, password_hash: passwordHash }
    });
    console.log('Admin account restored successfully (was soft-deleted or inactive). Password reset to folk2546.');
  } else {
    // Find admin role
    const adminRole = await prisma.role.findUnique({ where: { name: 'Administrator' } });
    if (!adminRole) {
      console.log('Administrator role not found. Cannot recreate from scratch without role ID.');
      return;
    }
    await prisma.user.create({
      data: {
        username: adminUsername,
        email: 'admin@company.com',
        password_hash: passwordHash,
        first_name: 'ผู้ดูแลระบบ',
        last_name: 'สูงสุด',
        role_id: adminRole.id,
        is_active: true,
        is_deleted: false
      }
    });
    console.log('Admin account recreated successfully. Password is folk2546.');
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
