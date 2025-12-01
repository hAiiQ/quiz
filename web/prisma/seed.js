/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const { questionSeed } = require("./data/questions");

const prisma = new PrismaClient();

async function seedQuestions() {
  await prisma.question.deleteMany();
  await prisma.question.createMany({
    data: questionSeed.map((question) => ({
      ...question,
      isDailyDouble: false,
    })),
  });
}

async function main() {
  await seedQuestions();

  console.log(`✅ Seeded ${questionSeed.length} Fragen.`);
}

main()
  .catch((error) => {
    console.error("❌ Prisma seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
