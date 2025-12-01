/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const { questionSeed } = require("./data/questions");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL muss gesetzt sein, bevor prisma/seed.js ausgeführt wird.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

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
    console.error("⛔ Prisma seed failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
