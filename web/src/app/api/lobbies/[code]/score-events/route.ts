import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { getLobbyByCode } from "@/server/lobbies/service";
import { getLobbyScoreEvents } from "@/server/game/score";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Nicht eingeloggt" }, { status: 401 });
  }

  const lobby = await getLobbyByCode(code);
  if (!lobby) {
    return NextResponse.json({ message: "Lobby nicht gefunden" }, { status: 404 });
  }

  type ParticipantRecord = (typeof lobby.participants)[number];
  const isMember = lobby.participants.some(
    (participant: ParticipantRecord) => participant.userId === session.user.id,
  );
  if (!isMember) {
    return NextResponse.json({ message: "Kein Zugriff auf diese Lobby" }, { status: 403 });
  }

  const events = await getLobbyScoreEvents(lobby.id);
  return NextResponse.json({ events });
}
