const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    data: {
      signature_image_path: null,
    },
  });
  console.log(`SUCCESS: Cleared signatures for ${result.count} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
