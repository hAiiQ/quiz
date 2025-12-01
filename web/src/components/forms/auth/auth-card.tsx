import type { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur">
      <header className="mb-8 space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Quizduell</p>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="text-sm text-white/70">{subtitle}</p>
      </header>
      {children}
    </div>
  );
}
