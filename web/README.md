# Quizduell Web

Render-kompatible Next.js 14 (App Router) Anwendung für das Quizduell-Jeopardy-Spiel.

## Stack

- **Frontend**: React 19, Tailwind CSS 4, Zustand, TanStack Query.
- **Backend**: Next.js Route Handler + Socket.IO, Prisma ORM.
- **Auth**: NextAuth Credentials.
- **Realtime/Video**: Socket.IO (Events) + simple-peer (WebRTC Mesh).

## Umgebung

- Prisma 7 verwendet hier bewusst den neuen `client`-Engine-Typ; über den `@prisma/adapter-pg`-Treiber wird unser `pg.Pool` (per `DATABASE_URL`) an den Client durchgereicht. Damit läuft das Build sauber ohne den Legacy-Binary-Daemon und bleibt gleichzeitig kompatibel mit Render/Serverless.
- Für lokale Tests reicht es, `DATABASE_URL` im `.env` zu setzen; es ist kein zusätzliches `PRISMA_CLIENT_ENGINE_TYPE` mehr nötig. Wer explizit zurück auf den Binary-Engine-Pfad möchte, kann die Adapter-Zeilen in `src/server/db.ts` auskommentieren und optional `PRISMA_CLIENT_ENGINE_TYPE=binary` setzen.

## Skripte

```powershell
npm run dev         # Dev-Server
npm run build       # Prod-Build
npm run start       # Prod-Server
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm run format      # Prettier
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy  # Migration nur anwenden (z.B. Render)
npm run prisma:studio
npm run prisma:seed   # Fragen-Dataset befüllen
npm run render:build  # Lokaler Test für das Render-Build-Skript
```

## Fragen-Dataset

Im Ordner `prisma/data` liegt ein kleines Default-Set mit sechs Kategorien und beiden Rundenwerten. Über `npm run prisma:seed` (bzw. `npx prisma db seed`) wird die `Question`-Tabelle komplett geleert und anschließend mit diesen Daten befüllt. Neue Fragen können einfach direkt in `prisma/data/questions.js` ergänzt werden.

## Live-Lobby & Board

- Route-Handler unter `/api/lobbies/[code]/board/*` liefern Board-Daten (inkl. Teilnehmer-Scores) und nehmen Admin-Aktionen entgegen (`select`, `resolve`).
- Die Detailseite `/lobby/[code]` lädt den Server-Teil synchron (Sitzplatzprüfung) und rendert anschließend das clientseitige Board mit React Query.
- Das Grid aktualisiert sich alle 5 Sekunden automatisch; Admins können Fragen aktivieren und anschließend über die Buzz-Queue per `Korrekt`/`Falsch`/`Skip` entscheiden.
- Spieler nutzen `POST /api/lobbies/[code]/board/buzz`, um sich während einer aktiven Frage in die Buzz-Queue einzureihen; Admins werten einzelne Buzzes über `POST /api/lobbies/[code]/board/buzz/:attemptId/result` aus (inkl. Halb-Abzug bei falscher Antwort).
- Die UI zeigt eine Buzz-Queue mit Pending/Correct/Incorrect-Status, sodass der Host die Reihenfolge komfortabel abarbeiten kann; Spieler sehen einen dedizierten Buzz-Button mit Statusmeldung.
- Bei der Frage-Aktivierung startet automatisch ein 30-Sekunden-Timer (`QUESTION_TIMER_SECONDS`). `QuestionState` speichert `activatedAt`/`timerEndsAt`, sodass Clients die Restzeit anzeigen können; nach jedem Buzz wird der Timer wieder auf 30 Sekunden gesetzt. Läuft er komplett ab, blockiert der Buzz-Button und Admins können die Frage direkt schließen.
- Läuft der Timer ab, bevor ein Ergebnis gesetzt wurde, markiert der Server die Frage automatisch als `DISCARDED` und verhindert weitere Buzzes – so bleibt der Spielablauf konsistent, auch wenn der Host kurz abgelenkt ist.
- Ein Score-Feed (GET `/api/lobbies/[code]/score-events`) listet die letzten Punktezuteilungen inklusive Kategorie/Wert auf; das Board zeigt diesen Feed in der Sidebar.

> Nach Schema-Änderungen (`activatedAt`/`timerEndsAt`) bitte `npm run prisma:migrate` ausführen, um die Felder in der Datenbank anzulegen.

## Deployment auf Render

1. **Environment Variablen** wie in `.env.example` setzen (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, TURN-Creds, `NEXT_PUBLIC_*`). Als `DATABASE_URL` auf Render die **Internal Database URL** verwenden.
2. **Build Command** in Render auf `bash ./render-build.sh` stellen. Das Skript führt `npm install`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run prisma:seed` und `npm run build` aus. So landen Schema-Änderungen und das Fragen-Dataset automatisch in der Render-Postgres-Instanz.
3. **Start Command** bleibt `npm run start`.
4. Optional kann das Skript auch lokal ausprobiert werden (`npm run render:build`). Für lokale Entwicklung gegen die Cloud-Datenbank einfach die External Database URL in `.env` setzen und `npx prisma migrate deploy` laufen lassen.

## Struktur

```

	app/          # App Router Pages (Landing, Auth, Lobby, Game ...)
	lib/          # Framework-agnostische Helfer (env, utils, game-config)
	server/       # Server-Utilities (Prisma Client, Actions)
	generated/    # Prisma Client (auto)
```

Detail-Spezifikationen siehe `../docs/architecture.md`.
