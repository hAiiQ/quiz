import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import { MAX_PLAYERS } from "@/lib/game-config";
import { cn } from "@/lib/utils";

export type LobbyParticipantDisplay = {
  id: string;
  role: "ADMIN" | "PLAYER";
  seatIndex: number | null;
  state: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
};

export interface LobbyCardProps {
  id: string;
  code: string;
  name: string;
  status: string;
  roundIndex: number;
  participants: LobbyParticipantDisplay[];
}

export function LobbyCard({ code, name, status, participants }: LobbyCardProps) {
  const playerSeats = participants
    .filter((p) => p.role === "PLAYER")
    .sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0));
  const admin = participants.find((p) => p.role === "ADMIN");
  const occupiedSeats = playerSeats.filter((player) => player.state === "ACTIVE").length;
  const statusLabel = status.replace(/_/g, " ");
  const statusToneMap: Record<string, string> = {
    PRE_GAME: "from-blue-500/30 via-blue-400/10",
    IN_PROGRESS: "from-purple-500/40 via-fuchsia-400/10",
    COMPLETED: "from-emerald-500/30 via-emerald-400/10",
  };
  const statusTone = statusToneMap[status] ?? "from-slate-500/30 via-slate-400/10";

  return (
    <Link
      href={`/lobby/${code}`}
      className="flex flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-white transition hover:border-purple-400/80 hover:bg-purple-500/10"
    >
      <div
        className={cn(
          "flex items-center justify-between bg-gradient-to-r px-5 py-3 text-xs uppercase tracking-[0.4em] text-white/80",
          statusTone,
        )}
      >
        <span>{statusLabel}</span>
        <span>{playerSeats.length ? `${playerSeats.length} Spieler` : "Noch leer"}</span>
      </div>
      <div className="flex items-center justify-between px-5">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Lobby</p>
          <h3 className="text-2xl font-semibold">{name}</h3>
          <p className="text-xs text-white/60">
            Spieler {occupiedSeats}/{MAX_PLAYERS}
          </p>
        </div>
        <div className="text-right text-sm text-purple-200">
          <div className="flex items-center justify-end gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-purple-100/80">Code</p>
              <p className="font-mono text-xl">{code}</p>
            </div>
            <CopyButton value={code} size="sm" variant="secondary">
              Kopieren
            </CopyButton>
          </div>
          <span className="mt-2 inline-flex items-center justify-end rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-white/70">
            {statusLabel}
          </span>
        </div>
      </div>
      {admin && (
        <p className="px-5 text-sm text-white/70">
          Admin: <span className="font-semibold">{admin.user.displayName}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 px-5 pb-5 text-sm">
        {playerSeats.map((player) => (
          <div
            key={player.id}
            className={cn(
              "rounded-2xl border border-white/20 px-3 py-2",
              player.state !== "ACTIVE" && "border-dashed text-white/50",
            )}
          >
            <p className="text-xs uppercase tracking-wide text-white/50">Platz {player.seatIndex! + 1}</p>
            <p className="font-medium">{player.user.displayName}</p>
          </div>
        ))}
        {playerSeats.length === 0 && <p className="col-span-2 text-white/60">Noch keine Spieler</p>}
      </div>
    </Link>
  );
}
