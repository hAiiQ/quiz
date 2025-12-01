import Link from "next/link";
import { MarkdownRenderer } from "@/components/docs/markdown-renderer";
import { loadMarkdownRelative } from "@/lib/markdown";

async function getArchitectureDoc() {
  try {
    return await loadMarkdownRelative("../docs/architecture.md");
  } catch (error) {
    console.error(error);
    return "# Dokumentation fehlt\nBitte stelle sicher, dass `docs/architecture.md` im Repository liegt.";
  }
}

export default async function DocsPage() {
  const markdown = await getArchitectureDoc();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-16 text-white">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Dokumentation</p>
        <h1 className="text-4xl font-semibold">Architektur & Specs</h1>
        <p className="text-white/70">
          Vollständige Markdown-Version direkt aus <code className="rounded bg-white/10 px-2 py-1">docs/architecture.md</code>.
        </p>
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm uppercase tracking-[0.2em] text-white/80 hover:border-white"
        >
          Zur Landing Page
        </Link>
      </header>

      <section className="rounded-3xl border border-white/10 bg-black/30 p-8">
        <MarkdownRenderer markdown={markdown} />
      </section>
    </main>
  );
}
