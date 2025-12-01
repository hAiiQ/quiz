import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { joinLobby } from "@/server/lobbies/service";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ message: "Ungültiger Body" }, { status: 400 });
  }

  try {
    const lobby = await joinLobby(session.user.id, body);
    return NextResponse.json({ lobby });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: (error as Error).message ?? "Lobby beitreten fehlgeschlagen" }, { status: 400 });
  }
}
