import { headers } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/server/auth/session";
import { getLobbyByCode } from "@/server/lobbies/service";
import { LobbyBoard } from "@/components/lobbies/lobby-board";
import { CopyButton } from "@/components/ui/copy-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

type LobbyDetail = NonNullable<Awaited<ReturnType<typeof getLobbyByCode>>>;
type ParticipantRecord = LobbyDetail["participants"][number];

interface LobbyDetailPageProps {
  params: Promise<{ code: string }> | { code: string };
}

export default async function LobbyDetailPage({ params }: LobbyDetailPageProps) {
  noStore();
  const resolvedParams = await Promise.resolve(params);
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const { code } = resolvedParams;
  const lobby = await getLobbyByCode(code);
  if (!lobby) {
    notFound();
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const shareUrl = `${protocol}://${host}/lobby/${code}`;

  const currentParticipant = lobby.participants.find(
    (participant: ParticipantRecord) => participant.userId === session.user.id,
  );
  if (!currentParticipant) {
    redirect("/lobby");
  }

  const isAdmin = currentParticipant.role === "ADMIN";
  const activeParticipants = lobby.participants.filter(
    (participant: ParticipantRecord) => participant.state === "ACTIVE",
  ).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Lobby</p>
        <h1 className="mt-2 text-4xl font-semibold">{lobby.name}</h1>
        <p className="text-white/70">{activeParticipants} / 5 Teilnehmende aktiv</p>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Lobby-Code</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/15 bg-black/20 px-4 py-3">
            <span className="text-2xl font-mono tracking-[0.3em] text-white">{lobby.code}</span>
            <CopyButton value={lobby.code}>Code kopieren</CopyButton>
          </div>
          <p className="mt-3 text-sm text-white/60">Teile diesen Code, damit Spieler*innen beitreten können.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Direkter Link</p>
          <div className="mt-4 space-y-2">
            <p className="break-all rounded-2xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/80">
              {shareUrl}
            </p>
            <CopyButton value={shareUrl} variant="secondary">
              Link kopieren
            </CopyButton>
          </div>
          <p className="mt-3 text-sm text-white/60">Ideal für Remote-Sessions oder Kalender-Einladungen.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-6">
        <h2 className="text-2xl font-semibold">Teilnehmer</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {lobby.participants.map((participant: ParticipantRecord) => (
            <div
              key={participant.id}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">{participant.role}</p>
                {participant.id === currentParticipant.id && (
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-xs text-purple-200">
                    Du
                  </span>
                )}
              </div>
              <p className="text-xl font-semibold">{participant.user.displayName}</p>
              <div className="mt-2 flex items-center justify-between text-sm text-white/60">
                <span>Status: {participant.state}</span>
                {typeof participant.seatIndex === "number" && (
                  <span>Sitz {participant.seatIndex + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
      <LobbyBoard code={lobby.code} isAdmin={isAdmin} selfParticipantId={currentParticipant.id} />
    </main>
  );
}
