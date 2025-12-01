import { prisma } from "@/server/db";

export async function getLobbyScoreEvents(lobbyId: string, limit = 25) {
  const events = await prisma.scoreEvent.findMany({
    where: { lobbyId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      participant: {
        include: {
          user: {
            select: { id: true, displayName: true, username: true },
          },
        },
      },
      question: {
        include: {
          question: {
            select: { category: true, baseValue: true },
          },
        },
      },
    },
  });

  type EventRecord = (typeof events)[number];

  return events.map((event: EventRecord) => ({
    id: event.id,
    delta: event.delta,
    reason: event.reason,
    createdAt: event.createdAt.toISOString(),
    participant: {
      id: event.participantId,
      seatIndex: event.participant.seatIndex,
      displayName: event.participant.user.displayName,
    },
    question: event.question
      ? {
          id: event.questionStateId,
          category: event.question.question.category,
          value: event.question.value,
        }
      : null,
  }));
}