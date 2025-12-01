# Quizduell – Full-Stack Multiplayer Jeopardy

Dieses Repository enthält:

- `docs/` – Architektur- & Feature-Notizen (siehe `architecture.md`).
- `web/` – Next.js 14 App mit Tailwind CSS, Prisma, NextAuth, Socket.IO & WebRTC (Render-kompatibel).

## Lokale Entwicklung

```powershell
cd web
npm install
npm run dev
```

Wichtige Zusatzbefehle:

```powershell
npm run lint
npm run typecheck
npm run format
npm run prisma:migrate
```

## Umgebung konfigurieren

1. `.env.example` nach `.env` kopieren (`cd web`).
2. Werte pflegen (Postgres, NextAuth, TURN, Socket-URL).
3. `npx prisma generate` ausführen, sobald das Schema erweitert wurde.

## Deployment-Hinweise (Render)

- **Web Service**: Next.js App als Node 18+ Service deployen (`npm run build` → `npm run start`).
- **PostgreSQL**: Render Managed Postgres; `DATABASE_URL` in Render-Env setzen.
- **TURN/WebRTC**: Für produktiven Einsatz eigenen TURN-Server oder z. B. Metered/OpenRelay Konfiguration nutzen.
- **WebSocket**: Render Web Service unterstützt Socket.IO out-of-the-box (keine separaten Ports nötig).

Weitere Details zur Architektur & Spiel-Logik findest du in `docs/architecture.md`.
