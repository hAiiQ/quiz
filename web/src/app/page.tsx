import Link from "next/link";
import { cn } from "@/lib/utils";

const sections = [
  {
    title: "Registrierung & Login",
    description: "Sichere Credential Auth mit NextAuth, Zod und Prisma.",
    href: "/register",
    status: "Coming soon",
    highlight: false,
  },
  {
    title: "Lobby & Spielverwaltung",
    description: "Lobbys erstellen, Codes teilen und Rejoin ermöglichen.",
    href: "/lobby",
    status: "Coming soon",
    highlight: false,
  },
  {
    title: "Live-Spielbrett",
    description: "Simuliertes Board mit Kameras, Timer und Scorefeed.",
    href: "/game/preview",
    status: "Neu",
    highlight: true,
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-16 text-foreground">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-purple-800/40 to-black/60 p-10 shadow-[0_0_80px_rgba(127,61,255,0.25)]">
        <p className="text-sm uppercase tracking-[0.3em] text-purple-200">Project Brief</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">
          Quizduell – Multiplayer Jeopardy mit Video & Echtzeit-Buzzern
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-purple-100/80">
          Diese Seite dient als Startpunkt für Auth, Lobby und Spieloberfläche. Nach und nach füllen
          wir die Module entsprechend der Spezifikation aus.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <Link
            href="/docs"
            className="rounded-full border border-white/30 px-5 py-2 text-white transition hover:border-white"
          >
            Architektur lesen
          </Link>
          <Link
            href="/login"
            className="rounded-full bg-purple-500/80 px-5 py-2 font-semibold text-white transition hover:bg-purple-400"
          >
            Zum Login
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.title}
            href={section.href}
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 text-white transition hover:border-purple-400/60 hover:bg-purple-400/10"
          >
            <h2 className="text-xl font-semibold">{section.title}</h2>
            <p className="mt-3 text-sm text-white/70">{section.description}</p>
            <span
              className={cn(
                "mt-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]",
                section.highlight ? "text-emerald-200" : "text-purple-200",
              )}
            >
              {section.status}
              <svg
                className="h-4 w-4 transition group-hover:translate-x-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}
