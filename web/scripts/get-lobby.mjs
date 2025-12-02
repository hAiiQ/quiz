import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const code = process.argv[2];

if (!code) {
  console.error("Usage: node scripts/get-lobby.mjs <CODE>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const lobby = await prisma.lobby.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: {
      participants: {
        include: {
          user: { select: { id: true, displayName: true, username: true } },
        },
      },
    },
  });
  console.log(JSON.stringify(lobby, null, 2));
} finally {
  await prisma.$disconnect();
  await pool.end();
}
