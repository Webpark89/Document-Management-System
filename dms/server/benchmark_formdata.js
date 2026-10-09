const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  console.time('versions-with-form-data');
  await prisma.document.findMany({
    take: 50,
    include: {
      versions: {
        select: { id: true, form_data: true },
        take: 1
      }
    }
  });
  console.timeEnd('versions-with-form-data');

  console.time('versions-without-form-data');
  await prisma.document.findMany({
    take: 50,
    include: {
      versions: {
        select: { id: true, version_number: true, file_size: true },
        take: 1
      }
    }
  });
  console.timeEnd('versions-without-form-data');
}
run().catch(console.error).finally(() => prisma.$disconnect());
