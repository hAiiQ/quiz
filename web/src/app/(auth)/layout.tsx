import type { ReactNode } from "react";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1d0a2f] to-[#05000a] px-4 py-16 text-white">
      {children}
    </main>
  );
}
