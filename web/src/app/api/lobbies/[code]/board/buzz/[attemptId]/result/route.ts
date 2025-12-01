import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { getLobbyByCode } from "@/server/lobbies/service";
import { buzzResultSchema } from "@/lib/validators/board";
import { markBuzzAttemptResult } from "@/server/game/buzzer";

type RouteContext = {
  params: Promise<{ code: string; attemptId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { code, attemptId } = await context.params;
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Nicht eingeloggt" }, { status: 401 });
  }

  const lobby = await getLobbyByCode(code);
  if (!lobby) {
    return NextResponse.json({ message: "Lobby nicht gefunden" }, { status: 404 });
  }

  const adminParticipant = lobby.participants.find(
    (item: (typeof lobby.participants)[number]) =>
      item.userId === session.user.id && item.role === "ADMIN",
  );

  if (!adminParticipant) {
    return NextResponse.json({ message: "Nur Admins dürfen Buzzers auswerten" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Ungültiger Body" }, { status: 400 });
  }

  const payload = buzzResultSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ message: "Ungültige Daten", issues: payload.error.format() }, { status: 400 });
  }

  try {
    const attempt = await markBuzzAttemptResult({
      lobbyId: lobby.id,
      attemptId,
      actingUserId: session.user.id,
      result: payload.data.result,
    });
    return NextResponse.json({ attempt });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: (error as Error).message }, { status: 400 });
  }
}
