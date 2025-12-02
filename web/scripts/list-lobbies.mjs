import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const lobbies = await prisma.lobby.findMany({
    include: {
      participants: {
        select: { id: true, userId: true, role: true, state: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  console.log(JSON.stringify(lobbies, null, 2));
} finally {
  await prisma.$disconnect();
  await pool.end();
}
