import { QUESTION_TIMER_SECONDS } from "@/lib/game-config";
import { prisma } from "@/server/db";
import { ensureLobbyAdmin, resolveQuestion } from "@/server/game/board";

type TransactionClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export async function submitBuzzAttempt(lobbyId: string, userId: string) {
  return prisma.$transaction(async (tx: TransactionClient) => {
    const participant = await tx.lobbyParticipant.findFirst({
      where: { lobbyId, userId },
    });

    if (!participant) {
      throw new Error("Kein Sitzplatz in dieser Lobby gefunden");
    }

    if (participant.role !== "PLAYER") {
      throw new Error("Nur Spieler dürfen buzzern");
    }

    if (participant.state !== "ACTIVE") {
      throw new Error("Nur aktive Spieler dürfen buzzern");
    }

    const activeQuestion = await tx.questionState.findFirst({
      where: { lobbyId, status: "ACTIVE" },
      include: {
        buzzAttempts: {
          select: { participantId: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!activeQuestion) {
      throw new Error("Keine aktive Frage zum Buzzern gefunden");
    }

    const now = new Date();
    if (activeQuestion.timerEndsAt && activeQuestion.timerEndsAt <= now) {
      throw new Error("Der Timer ist bereits abgelaufen");
    }

    type AttemptSummary = (typeof activeQuestion.buzzAttempts)[number];
    const alreadyBuzzed = activeQuestion.buzzAttempts.some(
      (attempt: AttemptSummary) => attempt.participantId === participant.id,
    );
    if (alreadyBuzzed) {
      throw new Error("Du hast für diese Frage bereits gebuzzert");
    }

    const orderIndex = activeQuestion.buzzAttempts.length;

    const buzzerAttempt = await tx.buzzerAttempt.create({
      data: {
        lobbyId,
        participantId: participant.id,
        questionStateId: activeQuestion.id,
        orderIndex,
      },
    });

    const refreshedActivatedAt = new Date();
    const refreshedTimerEndsAt = new Date(
      refreshedActivatedAt.getTime() + QUESTION_TIMER_SECONDS * 1000,
    );

    await tx.questionState.update({
      where: { id: activeQuestion.id },
      data: {
        activatedAt: refreshedActivatedAt,
        timerEndsAt: refreshedTimerEndsAt,
      },
    });

    return buzzerAttempt;
  });
}

export async function markBuzzAttemptResult(params: {
  lobbyId: string;
  attemptId: string;
  actingUserId: string;
  result: "CORRECT" | "INCORRECT" | "SKIPPED";
}) {
  const { lobbyId, attemptId, actingUserId, result } = params;

  return prisma.$transaction(async (tx: TransactionClient) => {
    await ensureLobbyAdmin(tx, lobbyId, actingUserId);

    const attempt = await tx.buzzerAttempt.findUnique({
      where: { id: attemptId },
      include: {
        questionState: true,
      },
    });

    if (!attempt || attempt.lobbyId !== lobbyId) {
      throw new Error("Buzz-Eintrag nicht gefunden");
    }

    if (attempt.result !== "PENDING") {
      throw new Error("Buzz-Eintrag wurde bereits ausgewertet");
    }

    if (attempt.questionState.status !== "ACTIVE") {
      throw new Error("Frage ist nicht mehr aktiv");
    }

    await tx.buzzerAttempt.update({
      where: { id: attemptId },
      data: { result },
    });

    if (result === "CORRECT" || result === "INCORRECT") {
      await resolveQuestion(
        {
          lobbyId,
          questionStateId: attempt.questionStateId,
          participantId: attempt.participantId,
          actingUserId,
          verdict: result,
        },
        tx,
      );
    }

    return tx.buzzerAttempt.findUnique({
      where: { id: attemptId },
      include: {
        participant: {
          include: {
            user: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
    });
  });
}
