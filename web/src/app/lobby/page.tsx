import { redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { listLobbiesForUser } from "@/server/lobbies/service";
import { CreateLobbyForm } from "@/components/forms/lobby/create-lobby-form";
import { JoinLobbyForm } from "@/components/forms/lobby/join-lobby-form";
import {
  LobbyCard,
  type LobbyParticipantDisplay,
  type LobbyCardProps,
} from "@/components/lobbies/lobby-card";

type LobbyRecord = Awaited<ReturnType<typeof listLobbiesForUser>>[number];
type ParticipantRecord = LobbyRecord["participants"][number];

export default async function LobbyHubPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const lobbies = await listLobbiesForUser(session.user.id);

  const lobbyCards: LobbyCardProps[] = lobbies.map((lobby: LobbyRecord) => ({
    id: lobby.id,
    code: lobby.code,
    name: lobby.name,
    status: lobby.status,
    roundIndex: lobby.roundIndex,
    participants: lobby.participants.map((participant: ParticipantRecord) => ({
      id: participant.id,
      role: participant.role,
      seatIndex: participant.seatIndex,
      state: participant.state,
      user: participant.user,
    })) as LobbyParticipantDisplay[],
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16">
      <header>
        <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Spielverwaltung</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Lobbys</h1>
        <p className="text-white/70">Erstelle neue Runden oder tritt via Code bei.</p>
      </header>
      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <h2 className="text-2xl font-semibold text-white">Neue Lobby</h2>
          <p className="text-sm text-white/70">Du bist automatisch Admin und wählst Fragen aus.</p>
          <div className="mt-6">
            <CreateLobbyForm />
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <h2 className="text-2xl font-semibold text-white">Per Code beitreten</h2>
          <p className="text-sm text-white/70">Maximal 4 Spieler gleichzeitig.</p>
          <div className="mt-6">
            <JoinLobbyForm />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Deine Lobbys</h2>
          <p className="text-sm text-white/60">{lobbyCards.length} aktiv</p>
        </div>
        {lobbyCards.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/20 px-6 py-10 text-center text-white/60">
            Noch keine Lobbys – starte eine neue Runde!
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {lobbyCards.map((lobby) => (
              <LobbyCard key={lobby.id} {...lobby} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
