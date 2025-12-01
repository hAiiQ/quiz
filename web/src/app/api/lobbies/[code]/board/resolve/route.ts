import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { getLobbyByCode } from "@/server/lobbies/service";
import { resolveQuestion } from "@/server/game/board";
import { resolveQuestionSchema } from "@/lib/validators/board";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Nicht eingeloggt" }, { status: 401 });
  }

  const lobby = await getLobbyByCode(code);
  if (!lobby) {
    return NextResponse.json({ message: "Lobby nicht gefunden" }, { status: 404 });
  }

  const adminParticipant = lobby.participants.find(
    (participant: (typeof lobby.participants)[number]) =>
      participant.userId === session.user.id && participant.role === "ADMIN",
  );

  if (!adminParticipant) {
    return NextResponse.json({ message: "Nur Admins dürfen Fragen auswerten" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Ungültiger Body" }, { status: 400 });
  }

  const payload = resolveQuestionSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ message: "Ungültige Daten", issues: payload.error.format() }, { status: 400 });
  }

  try {
    const result = await resolveQuestion({
      lobbyId: lobby.id,
      questionStateId: payload.data.questionStateId,
      participantId: payload.data.participantId,
      actingUserId: session.user.id,
      verdict: payload.data.verdict,
    });
    return NextResponse.json({ question: result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Frage konnte nicht ausgewertet werden" }, { status: 400 });
  }
}
