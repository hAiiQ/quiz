import { Button } from "@/components/ui/button";
import { QUESTION_TIMER_SECONDS } from "@/lib/game-config";
import { cn, formatPoints } from "@/lib/utils";
import {
  previewActiveQuestion,
  previewBuzzQueue,
  previewCameras,
  previewRounds,
  previewScores,
  type PreviewCamera,
  type PreviewQuestionStatus,
} from "./preview-data";

const statusTone: Record<PreviewQuestionStatus, string> = {
  UNPLAYED: "border-purple-500/30 bg-purple-600/15 text-purple-100",
  ACTIVE: "border-yellow-400/60 bg-yellow-500/15 text-yellow-50 animate-pulse",
  RESOLVED: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
  DISCARDED: "border-white/10 bg-white/5 text-white/40 line-through",
};

const cameraStatusTone: Record<PreviewCamera["status"], string> = {
  LIVE: "text-emerald-300",
  READY: "text-white/70",
  MUTED: "text-amber-200",
  OFFLINE: "text-red-300",
};

function CameraTile({ camera }: { camera: PreviewCamera }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br px-4 py-5 text-white",
        camera.accent,
        camera.role === "ADMIN" && "shadow-[0_0_40px_rgba(168,85,247,0.35)]",
      )}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em]">
        <span>{camera.seatLabel ?? camera.role}</span>
        <span className={cn("font-semibold", cameraStatusTone[camera.status])}>{camera.status}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold">{camera.name}</p>
      <div className="mt-6 flex h-32 items-center justify-center rounded-2xl border border-white/20 bg-black/20 text-sm text-white/60">
        {camera.role === "ADMIN" ? "Host-Ansicht" : "Spielerfeed"}
      </div>
      {camera.isSpeaking && (
        <div className="absolute inset-x-4 bottom-4 flex items-center gap-2 text-xs text-emerald-200">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
          Spricht gerade
        </div>
      )}
    </div>
  );
}

function BoardPreview() {
  return (
    <div className="space-y-8">
      {previewRounds.map((round) => (
        <div key={round.label} className="space-y-3">
          <div className="flex items-center justify-between text-white/70">
            <h3 className="text-xl font-semibold text-white">{round.label}</h3>
            <span className="text-xs uppercase tracking-[0.25em]">
              {round.categories.length} Kategorien
            </span>
          </div>
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${round.categories.length}, minmax(0, 1fr))` }}
          >
            {round.categories.map((category) => (
              <div key={`${round.label}-${category.title}`} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="pb-2 text-center text-xs font-semibold uppercase tracking-wide text-white/80">
                  {category.title}
                </p>
                <div className="space-y-2">
                  {category.questions.map((question, index) => (
                    <div
                      key={`${round.label}-${category.title}-${question.value}-${index}`}
                      className={cn(
                        "flex h-14 items-center justify-center rounded-xl border text-lg font-bold",
                        statusTone[question.status],
                      )}
                    >
                      {question.status === "UNPLAYED" && question.value}
                      {question.status === "ACTIVE" && "AKTIV"}
                      {question.status === "RESOLVED" && "✓"}
                      {question.status === "DISCARDED" && "—"}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ScorePreview() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
      <p className="text-xs text-white/60">Serverseitig berechnet & live gesynct</p>
      <div className="mt-4 space-y-3">
        {previewScores.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold text-white">{entry.name}</p>
              <p className="text-xs text-white/50">{entry.role === "ADMIN" ? "Admin" : "Spieler"}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-white/80">{formatPoints(entry.score)}</p>
              <p className="text-xs text-white/50">Trend {entry.trend}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveQuestionPreview() {
  const timerPercent = Math.max(
    0,
    Math.min(100, (previewActiveQuestion.remainingSeconds / QUESTION_TIMER_SECONDS) * 100),
  );

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold text-white">Aktive Frage</h3>
      <div className="mt-3 space-y-3 text-sm text-white/80">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">{previewActiveQuestion.category}</p>
          <p className="text-base font-semibold text-white">{previewActiveQuestion.prompt}</p>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>Timer</span>
            <span className="font-mono">{previewActiveQuestion.remainingSeconds}s</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-200"
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-white/60">Antwort nur für Admin: {previewActiveQuestion.answer}</p>
      </div>
    </div>
  );
}

function BuzzQueuePreview() {
  const statusToneMap: Record<"PENDING" | "CORRECT" | "INCORRECT", string> = {
    PENDING: "border-yellow-400/50 bg-yellow-500/10 text-yellow-100",
    CORRECT: "border-emerald-400/50 bg-emerald-500/10 text-emerald-100",
    INCORRECT: "border-red-400/40 bg-red-500/10 text-red-100",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-lg font-semibold text-white">Buzz-Queue</h3>
      <p className="text-xs text-white/60">Server entscheidet Reihenfolge</p>
      <div className="mt-4 space-y-2">
        {previewBuzzQueue.map((entry) => (
          <div key={entry.id} className={cn("rounded-2xl border px-3 py-2 text-sm", statusToneMap[entry.status])}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{entry.name}</p>
              <span className="text-xs font-mono uppercase tracking-[0.2em]">{entry.status}</span>
            </div>
            <p className="text-xs text-white/70">{entry.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GamePreviewShowcase() {
  const adminCamera = previewCameras.find((camera) => camera.role === "ADMIN");
  const playerCameras = previewCameras.filter((camera) => camera.role === "PLAYER");

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#130c1f] to-[#050407] p-6">
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            {adminCamera && <CameraTile camera={adminCamera} />}
            <div className="grid gap-4 sm:grid-cols-2">
              {playerCameras.map((camera) => (
                <CameraTile key={camera.id} camera={camera} />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <ScorePreview />
            <ActiveQuestionPreview />
            <BuzzQueuePreview />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Board</p>
            <h2 className="text-2xl font-semibold text-white">Jeopardy Layout</h2>
            <p className="text-sm text-white/60">Zwei Runden, Werte steigen automatisch.</p>
          </div>
          <Button variant="secondary" size="sm">Server States ansehen</Button>
        </div>
        <div className="mt-6">
          <BoardPreview />
        </div>
      </section>
    </div>
  );
}
