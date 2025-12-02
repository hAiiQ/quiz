import { prisma } from "@/server/db";
import { generateLobbyCode } from "@/lib/lobby-code";
import { MAX_PLAYERS } from "@/lib/game-config";
import { ensureLobbyBoard } from "@/server/game/board";
import {
  createLobbySchema,
  joinLobbySchema,
  type CreateLobbyInput,
  type JoinLobbyInput,
} from "@/lib/validators/lobby";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function generateUniqueCode() {
  for (let i = 0; i < 10; i += 1) {
    const code = generateLobbyCode();
    const existing = await prisma.lobby.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new Error("Konnte keinen eindeutigen Lobby-Code generieren");
}

export async function createLobby(userId: string, input: CreateLobbyInput) {
  const payload = createLobbySchema.parse(input);
  const code = await generateUniqueCode();

  const lobby = await prisma.$transaction(async (tx: TransactionClient) => {
    const newLobby = await tx.lobby.create({
      data: {
        name: payload.name.trim(),
        code,
        ownerId: userId,
        participants: {
          create: {
            userId,
            role: "ADMIN",
            seatIndex: null,
          },
        },
      },
    });
    return newLobby;
  });

  await ensureLobbyBoard(lobby.id);

  return lobby;
}

export async function joinLobby(userId: string, input: JoinLobbyInput) {
  const sanitizedCode = input.code?.trim().toUpperCase();
  const payload = joinLobbySchema.parse({ ...input, code: sanitizedCode });

  return prisma.$transaction(async (tx: TransactionClient) => {
    const lobby = await tx.lobby.findUnique({
      where: { code: payload.code },
      include: {
        participants: true,
      },
    });

    if (!lobby) {
      throw new Error("Lobby nicht gefunden");
    }

    const participants = lobby.participants;
    type Participant = (typeof participants)[number];

    const existingParticipant = participants.find((p: Participant) => p.userId === userId);
    if (existingParticipant) {
      if (existingParticipant.role === "ADMIN") {
        return lobby;
      }

      await tx.lobbyParticipant.update({
        where: { id: existingParticipant.id },
        data: { state: "ACTIVE", updatedAt: new Date() },
      });
      return lobby;
    }

    const playerCount = participants.filter((p: Participant) => p.role === "PLAYER").length;
    if (playerCount >= MAX_PLAYERS) {
      throw new Error("Lobby ist bereits voll");
    }

    const takenSeats = new Set(
      participants
        .filter((p: Participant) => typeof p.seatIndex === "number")
        .map((p: Participant) => p.seatIndex as number),
    );
    let seatIndex = 0;
    while (takenSeats.has(seatIndex) && seatIndex < MAX_PLAYERS) {
      seatIndex += 1;
    }

    await tx.lobbyParticipant.create({
      data: {
        lobbyId: lobby.id,
        userId,
        role: "PLAYER",
        seatIndex,
      },
    });

    return lobby;
  });
}

export async function listLobbiesForUser(userId: string) {
  return prisma.lobby.findMany({
    where: {
      participants: {
        some: { userId },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getLobbyByCode(code: string | undefined | null) {
  if (!code) {
    return null;
  }

  const normalized = code.trim().toUpperCase();

  return prisma.lobby.findUnique({
    where: { code: normalized },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, username: true, displayName: true },
          },
        },
        orderBy: { role: "asc" },
      },
    },
  });
}
