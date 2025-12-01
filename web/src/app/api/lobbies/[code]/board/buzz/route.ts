import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { getLobbyByCode } from "@/server/lobbies/service";
import { submitBuzzAttempt } from "@/server/game/buzzer";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Nicht eingeloggt" }, { status: 401 });
  }

  const lobby = await getLobbyByCode(code);
  if (!lobby) {
    return NextResponse.json({ message: "Lobby nicht gefunden" }, { status: 404 });
  }

  const participant = lobby.participants.find(
    (item: (typeof lobby.participants)[number]) => item.userId === session.user.id,
  );

  if (!participant) {
    return NextResponse.json({ message: "Kein Zugriff auf diese Lobby" }, { status: 403 });
  }

  try {
    const attempt = await submitBuzzAttempt(lobby.id, session.user.id);
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }
}
