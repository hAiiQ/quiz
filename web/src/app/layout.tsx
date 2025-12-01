import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getClientEnv } from "@/lib/env";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteName = getClientEnv().NEXT_PUBLIC_APP_NAME;

export const metadata: Metadata = {
  title: `${siteName} – Multiplayer Quizduell`,
  description: "Live-Jeopardy mit Lobby, Kameras & Buzzern",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
