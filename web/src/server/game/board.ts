import { QUESTION_TIMER_SECONDS } from "@/lib/game-config";
import { prisma } from "@/server/db";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function ensureLobbyAdmin(
  db: TransactionClient | typeof prisma,
  lobbyId: string,
  userId: string,
) {
  if (!userId) {
    throw new Error("User-ID erforderlich");
  }

  const admin = await db.lobbyParticipant.findFirst({
    where: { lobbyId, userId, role: "ADMIN" },
  });

  if (!admin) {
    throw new Error("Nur Admins dürfen diese Aktion ausführen");
  }

  return admin;
}

async function runWithTransaction<T>(
  cb: (tx: TransactionClient) => Promise<T>,
  db?: TransactionClient,
): Promise<T> {
  if (db) {
    return cb(db);
  }
  return prisma.$transaction(cb);
}

async function closePendingBuzzers(tx: TransactionClient, questionStateId: string) {
  await tx.buzzerAttempt.updateMany({
    where: { questionStateId, result: "PENDING" },
    data: { result: "SKIPPED" },
  });
}

export async function ensureLobbyBoard(lobbyId: string) {
  const hasStates = await prisma.questionState.count({ where: { lobbyId } });
  if (hasStates > 0) {
    return;
  }

  const questions = await prisma.question.findMany({
    orderBy: [
      { roundIndex: "asc" },
      { categoryIndex: "asc" },
      { baseValue: "asc" },
    ],
  });

  if (questions.length === 0) {
    throw new Error("Keine Fragen vorhanden. Bitte zuerst `npm run prisma:seed` ausführen.");
  }

  type QuestionRecord = (typeof questions)[number];

  await prisma.questionState.createMany({
    data: questions.map((question: QuestionRecord) => ({
      lobbyId,
      questionId: question.id,
      roundIndex: question.roundIndex,
      value: question.baseValue,
      status: "UNPLAYED",
    })),
  });
}

async function expireElapsedQuestions(lobbyId: string) {
  const now = new Date();
  const expired = await prisma.questionState.findMany({
    where: {
      lobbyId,
      status: "ACTIVE",
      timerEndsAt: { lte: now },
    },
    select: { id: true },
  });

  if (expired.length === 0) {
    return;
  }

  type ExpiredState = (typeof expired)[number];

  await prisma.$transaction(async (tx: TransactionClient) => {
    for (const state of expired as ExpiredState[]) {
      await tx.questionState.update({
        where: { id: state.id },
        data: {
          status: "DISCARDED",
          timerEndsAt: null,
        },
      });
      await closePendingBuzzers(tx, state.id);
    }
  });
}

export async function getLobbyBoard(lobbyId: string) {
  await ensureLobbyBoard(lobbyId);
  await expireElapsedQuestions(lobbyId);

  const states = await prisma.questionState.findMany({
    where: { lobbyId },
    include: {
      question: true,
      buzzAttempts: {
        include: {
          participant: {
            include: {
              user: {
                select: { id: true, displayName: true, username: true },
              },
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
    orderBy: [
      { roundIndex: "asc" },
      { question: { categoryIndex: "asc" } },
      { value: "asc" },
    ],
  });

  const rounds: Record<
    number,
    Record<number, { category: string; categoryIndex: number; questions: typeof states }>
  > = {};

  type QuestionStateWithQuestion = (typeof states)[number];

  states.forEach((state: QuestionStateWithQuestion) => {
    const roundBucket = (rounds[state.roundIndex] ||= {});
    const catBucket = (roundBucket[state.question.categoryIndex] ||= {
      category: state.question.category,
      categoryIndex: state.question.categoryIndex,
      questions: [] as typeof states,
    });
    catBucket.questions.push(state);
  });

  return Object.entries(rounds)
    .map(([roundIndex, categories]) => ({
      roundIndex: Number(roundIndex),
      categories: Object.values(categories).sort((a, b) => a.categoryIndex - b.categoryIndex),
    }))
    .sort((a, b) => a.roundIndex - b.roundIndex);
}

type QuestionVerdict = "CORRECT" | "INCORRECT" | "SKIPPED";

async function assertQuestionBelongsToLobby(questionStateId: string, lobbyId: string) {
  const state = await prisma.questionState.findUnique({
    where: { id: questionStateId },
    include: { lobby: true, question: true },
  });

  if (!state || state.lobbyId !== lobbyId) {
    throw new Error("Frage gehört nicht zur Lobby");
  }

  return state;
}

export async function selectQuestion(
  lobbyId: string,
  questionStateId: string,
  actingUserId: string,
) {
  await ensureLobbyAdmin(prisma, lobbyId, actingUserId);

  const existingActive = await prisma.questionState.findFirst({
    where: { lobbyId, status: "ACTIVE" },
    select: { id: true },
  });

  if (existingActive) {
    throw new Error("Es ist bereits eine Frage aktiv");
  }

  const state = await assertQuestionBelongsToLobby(questionStateId, lobbyId);

  if (state.status !== "UNPLAYED") {
    throw new Error("Frage ist bereits aktiv oder abgeschlossen");
  }

  const activatedAt = new Date();
  const timerEndsAt = new Date(activatedAt.getTime() + QUESTION_TIMER_SECONDS * 1000);

  return prisma.questionState.update({
    where: { id: questionStateId },
    data: {
      status: "ACTIVE",
      selectedById: actingUserId,
      activatedAt,
      timerEndsAt,
    },
    include: { question: true },
  });
}

export async function resolveQuestion(
  params: {
    lobbyId: string;
    questionStateId: string;
    participantId?: string;
    actingUserId: string;
    verdict: QuestionVerdict;
  },
  db?: TransactionClient,
) {
  const { lobbyId, questionStateId, participantId, actingUserId, verdict } = params;

  return runWithTransaction(async (tx: TransactionClient) => {
    await ensureLobbyAdmin(tx, lobbyId, actingUserId);

    const state = await tx.questionState.findUnique({
      where: { id: questionStateId },
      include: { lobby: true },
    });

    if (!state || state.lobbyId !== lobbyId) {
      throw new Error("Frage gehört nicht zur Lobby");
    }

    if (verdict !== "SKIPPED" && !participantId) {
      throw new Error("Teilnehmer erforderlich");
    }

    if (verdict === "CORRECT" && state.status !== "ACTIVE") {
      throw new Error("Frage ist nicht aktiv");
    }

  let statusUpdate = state.status;
  let shouldClosePending = false;
    const updates: Promise<unknown>[] = [];

    const affectParticipant = participantId
      ? await tx.lobbyParticipant.findUnique({ where: { id: participantId } })
      : null;

    if (participantId && !affectParticipant) {
      throw new Error("Teilnehmer nicht gefunden");
    }

    if (participantId && affectParticipant?.lobbyId !== lobbyId) {
      throw new Error("Teilnehmer gehört nicht zur Lobby");
    }

    if (verdict === "CORRECT" && participantId) {
      const delta = state.value;
      updates.push(
        tx.lobbyParticipant.update({
          where: { id: participantId },
          data: { score: { increment: delta } },
        }),
      );
      updates.push(
        tx.scoreEvent.create({
          data: {
            lobbyId,
            participantId,
            questionStateId,
            delta,
            reason: "QUESTION_CORRECT",
            userId: actingUserId,
          },
        }),
      );
      statusUpdate = "RESOLVED";
      shouldClosePending = true;
    }

    if (verdict === "INCORRECT" && participantId) {
      const penalty = Math.ceil(state.value / 2);
      const delta = -penalty;
      updates.push(
        tx.lobbyParticipant.update({
          where: { id: participantId },
          data: { score: { increment: delta } },
        }),
      );
      updates.push(
        tx.scoreEvent.create({
          data: {
            lobbyId,
            participantId,
            questionStateId,
            delta,
            reason: "QUESTION_INCORRECT",
            userId: actingUserId,
          },
        }),
      );
    }

    if (verdict === "SKIPPED") {
      statusUpdate = "DISCARDED";
      shouldClosePending = true;
    }

    const keepActive = statusUpdate === "ACTIVE";

    updates.push(
      tx.questionState.update({
        where: { id: questionStateId },
        data: {
          status: statusUpdate,
          resolvedById: statusUpdate === "RESOLVED" ? actingUserId : state.resolvedById,
          activatedAt: keepActive ? state.activatedAt : null,
          timerEndsAt: keepActive ? state.timerEndsAt : null,
        },
      }),
    );

    await Promise.all(updates);

    if (shouldClosePending) {
      await closePendingBuzzers(tx, questionStateId);
    }

    return tx.questionState.findUnique({
      where: { id: questionStateId },
      include: { question: true },
    });
  }, db);
}
