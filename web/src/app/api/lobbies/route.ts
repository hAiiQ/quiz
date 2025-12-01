import { NextResponse } from "next/server";
import { getCurrentSession } from "@/server/auth/session";
import { createLobby, listLobbiesForUser } from "@/server/lobbies/service";

export async function GET() {
  const session = await getCurrentSession();
  if (!session?.user) {
    return NextResponse.json({ message: "Nicht eingeloggt" }, { status: 401 });
  }

  const lobbies = await listLobbiesForUser(session.user.id);
  return NextResponse.json({ lobbies });
}

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
    const lobby = await createLobby(session.user.id, body);
    return NextResponse.json({ lobby }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Lobby konnte nicht erstellt werden" }, { status: 400 });
  }
}
