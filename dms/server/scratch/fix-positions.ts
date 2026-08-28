import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allowedNames = ['พนักงาน', 'หัวหน้าแผนก', 'ผู้บริหาร', 'ผู้ดูแลระบบ'];
  
  // Ensure the 4 positions exist
  const pos1 = await prisma.position.upsert({ where: { name: 'พนักงาน' }, update: { level: 'L1' }, create: { name: 'พนักงาน', level: 'L1' } });
  const pos2 = await prisma.position.upsert({ where: { name: 'หัวหน้าแผนก' }, update: { level: 'L2' }, create: { name: 'หัวหน้าแผนก', level: 'L2' } });
  const pos3 = await prisma.position.upsert({ where: { name: 'ผู้บริหาร' }, update: { level: 'L5' }, create: { name: 'ผู้บริหาร', level: 'L5' } });
  const pos4 = await prisma.position.upsert({ where: { name: 'ผู้ดูแลระบบ' }, update: { level: 'L5' }, create: { name: 'ผู้ดูแลระบบ', level: 'L5' } });

  const allowedIds = [pos1.id, pos2.id, pos3.id, pos4.id];

  // Map users with other positions to 'พนักงาน' (pos1) or 'ผู้ดูแลระบบ' (pos4)
  const users = await prisma.user.findMany({ include: { position: true, role: true } });
  for (const user of users) {
    if (user.position && !allowedNames.includes(user.position.name)) {
      console.log(`Reassigning user ${user.username} from ${user.position.name} to พนักงาน`);
      await prisma.user.update({
        where: { id: user.id },
        data: { position_id: pos1.id }
      });
    } else if (!user.position && user.role?.name === 'Administrator') {
      console.log(`Assigning Admin ${user.username} to ผู้ดูแลระบบ`);
      await prisma.user.update({
        where: { id: user.id },
        data: { position_id: pos4.id }
      });
    } else if (!user.position) {
       await prisma.user.update({
        where: { id: user.id },
        data: { position_id: pos1.id }
      });
    }
  }

  // Delete all other positions
  const allPos = await prisma.position.findMany();
  for (const p of allPos) {
    if (!allowedNames.includes(p.name)) {
      console.log(`Deleting position ${p.name}`);
      await prisma.position.delete({ where: { id: p.id } });
    }
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
