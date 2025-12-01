import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { getLobbyByCode } from "@/server/lobbies/service";
import { getLobbyBoard } from "@/server/game/board";

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

  const isMember = lobby.participants.some(
    (participant: (typeof lobby.participants)[number]) => participant.userId === session.user.id,
  );
  if (!isMember) {
    return NextResponse.json({ message: "Kein Zugriff auf diese Lobby" }, { status: 403 });
  }

  const board = await getLobbyBoard(lobby.id);
  type ParticipantRecord = (typeof lobby.participants)[number];
  const participants = lobby.participants.map((participant: ParticipantRecord) => ({
    id: participant.id,
    userId: participant.userId,
    role: participant.role,
    score: participant.score,
    seatIndex: participant.seatIndex,
    state: participant.state,
    user: participant.user,
  }));

  return NextResponse.json({ board, participants });
}
