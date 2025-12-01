import Link from "next/link";
import { GamePreviewShowcase } from "@/components/game/game-preview";

const featureHighlights = [
  {
    title: "Server-Autorität",
    description:
      "Timer, Buzz-Queue und Score-Ledger laufen vollständig auf dem Server und replizieren sich via API & Socket Events.",
  },
  {
    title: "Video-Mesh",
    description:
      "Bis zu 5 Kacheln (Admin + 4 Spieler) verbinden sich per simple-peer und Socket.IO Signaling zu einem stabilen Mesh.",
  },
  {
    title: "Runden-Logik",
    description:
      "Zwei Runden mit steigenden Stakes, automatische Sperre von Fragen und Rejoin-fähigen Sitzplätzen.",
  },
];

export default function GamePreviewPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-6 py-16 text-white">
      <section className="space-y-6">
        <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Gameplay</p>
        <h1 className="text-4xl font-semibold leading-tight">Live-Board Preview</h1>
        <p className="max-w-3xl text-lg text-white/70">
          So fühlt sich das finale Quizduell-Board an: Kamerakacheln, Admin-Panel, Buzz-Queue, Timer und
          Scoreboard sitzen in einem Render-kompatiblen Layout. Darunter läuft die Prisma/Socket.IO Engine,
          die Lobbys synchron hält.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/lobby"
            className="inline-flex items-center justify-center rounded-full bg-purple-500/90 px-5 py-2 font-semibold text-white transition hover:bg-purple-400"
          >
            Lobby öffnen
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 font-semibold text-white/80 transition hover:border-white/60"
          >
            Architektur lesen
          </Link>
        </div>
      </section>

      <GamePreviewShowcase />

      <section className="grid gap-4 md:grid-cols-3">
        {featureHighlights.map((feature) => (
          <div key={feature.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-purple-200">Feature</p>
            <h2 className="mt-2 text-xl font-semibold text-white">{feature.title}</h2>
            <p className="mt-3 text-sm text-white/70">{feature.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
