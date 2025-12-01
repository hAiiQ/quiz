# Quizduell – Architektur & Feature-Spezifikation

## 1. Produktvision
Ein webbasiertes, administriertes Jeopardy-Spiel mit bis zu vier aktiven Spieler*innen plus Admin. Das System bietet Registrierung/Login, Lobby-Management, zwei Spielrunden mit steigendem Punktewert, Echtzeitkommunikation, Video-Kacheln und präzise Spiel- und Punkteverwaltung. Deployment-Ziel: Render (Web Service + PostgreSQL + ggf. Redis/TURN-Service).

## 2. Gameplay-Regeln & UI-Anforderungen
- **Layout** wie Referenzbild:
  - Links oben Admin-Kamera mit Nametag unten.
  - Unten vier Spielerkameras (feste Reihenfolge links→rechts) mit Nametag unten; aktiver Spieler-Rahmen leuchtet.
  - Mittig Jeopardy-Board (6 Kategorien × 4 Werte pro Runde).
  - Rechts oben "Zurück zur Lobby" Button; zwischen Board und Button: Anzeige "Spieler X ist dran".
  - Admin-spezifisches Popup mit aktueller Antwort.
- **Runden**:
  - Runde 1: 100/200/300/500 Punkte; Runde 2: 200/400/600/1000 Punkte.
  - Runde 2 startet, sobald alle Fragen aus Runde 1 abgeschlossen sind (inkl. ggf. geschlossener, falsch beantworteter Fragen).
- **Frage-Flow**:
  1. Nur Admin kann ein Feld wählen; Feld wird grau (disabled) sobald fertig.
  2. Timer (30 s) startet, wenn Frage geöffnet wird; jeder Buzz-Event setzt Timer zurück.
  3. Admin markiert Antworten als richtig/falsch. Bei falscher Antwort schrumpft Spielerpunkte um die Hälfte des Fragestakes.
  4. Andere Spieler dürfen der Reihe nach buzzern (wer bereits dran war, wird für diese Frage gesperrt). Wenn niemand buzzert, kann Admin Frage schließen.
  5. Bei richtiger Antwort: voller Fragestake addiert, Spieler erhält nächste Auswahl.
- **Lobby-Rejoin**: Spieler können Lobby verlassen und via Lobby-Code mit gleicher Rolle/User-ID zurückkehren.
- **Video**: Admin + 4 Spieler mit WebRTC-Kacheln; zuverlässige Kamera, Fallback bei Verlust.
- **Admin-Controls**: Fragen auswählen, Antworten bewerten, Timer steuern, Frage schließen, Buzzermanagement, Popup mit Lösung.

## 3. Nicht-funktionale Anforderungen
- **Deployment**: Render kompatibel (Next.js 14 App Router). Separate services:
  - Web Service (Next.js + Socket.IO + WebRTC Signaling + Prisma API).
  - Managed PostgreSQL (Render PostgreSQL).
  - Optional Redis (Render) für Presence/Rate-Limits/Timers.
- **Scalability**: Single-lobby concurrency moderate (<50). WebSockets multiplexed per lobby namespace.
- **Reliability**: Persistent state in DB; ephemeral realtime caches replicated from DB when clients reconnect.
- **Security**: BCrypt password hashing, session cookies/httpOnly, CSRF protection via NextAuth, validation via Zod.

## 4. Technologie-Stack
| Concern | Choice | Notes |
| --- | --- | --- |
| Frontend Framework | Next.js 14 (App Router) + React 18 + TypeScript | Hybrid SSR/ISR, Edge-friendly; easy Render deploy |
| Styling/UI | Tailwind CSS + shadcn/ui + Framer Motion (light) | Schnelle UI-Iterationen; Komponenten modular |
| State Mgmt | React Query (TanStack) + Zustand (local) | Query caching + small local stores |
| Forms & Validation | React Hook Form + Zod | Typed validation |
| Backend Runtime | Next.js Route Handlers / Server Actions | Single repo |
| Database | PostgreSQL via Prisma ORM | Migrations manageable |
| Auth | NextAuth Credentials Provider + JWT Session | Works with Next serverless + DB |
| Real-time | Socket.IO server (Next custom server) | Handles lobby/game events + buzzer |
| Timers | Server authoritative via Node timers synced through Socket.IO | Guarantees fairness |
| Video | WebRTC (simple-peer) + Socket.IO signaling + public STUN (`stun:stun.l.google.com:19302`). Optional TURN via [Metered TURN](https://www.metered.ca/tools/openrelay) for Render |
| File Storage | N/A (no uploads) |
| Testing | Vitest + Playwright (critical flows) | API/unit + e2e for lobby round |

## 5. Dienste & Module
1. **Auth Service**
   - Routes: `/api/auth/register`, `/api/auth/login`, NextAuth session endpoints.
   - Prisma models: `User`, `Session`.
2. **Lobby Service**
   - CRUD: Create lobby, join via code, list my lobbies, rejoin.
   - Models: `Lobby`, `LobbyParticipant`, `LobbyInvite` (code), `LobbySettings` (round config).
   - Admin flagged via `role`.
3. **Game Engine**
   - Models: `Category`, `Question`, `Round`, `QuestionState`, `Turn`, `ScoreEvent`, `BuzzerAttempt`.
   - State machine: `idle` → `question_selected` → `answering` → `buzz_window` → `resolved`.
   - Timer orchestration stored in Redis/Memory + persisted snapshot each transition.
4. **Realtime Gateway**
   - Socket namespaces per lobby: `room:lobbyId`.
   - Events: `lobby:update`, `game:state`, `game:timer`, `buzz:attempt`, `admin:action`, `video:signal`.
5. **Video Service**
   - WebRTC peer mesh limited to 5 peers. Signaling via Socket.IO event `video:signal`.
   - Each peer uses `simple-peer` (initiator flagged). Admin/players connect to others as soon as they join.
6. **UI Composition**
   - Pages: `/` landing, `/register`, `/login`, `/lobby`, `/lobby/[code]`, `/game/[lobbyId]`.
   - Components segmented by functionality (CameraTile, BoardColumn, QuestionCard, TimerRing, AdminPanel, BuzzerQueue, ScoreBadge, etc.).

## 6. Datenmodell (Prisma-Schema Entwurf)
```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  participants LobbyParticipant[]
}

model Lobby {
  id            String   @id @default(cuid())
  code          String   @unique
  name          String
  ownerId       String
  owner         User     @relation(fields: [ownerId], references: [id])
  status        LobbyStatus @default(PRE_GAME)
  createdAt     DateTime @default(now())
  settings      LobbySettings?
  participants  LobbyParticipant[]
  rounds        Round[]
}

enum LobbyStatus { PRE_GAME IN_PROGRESS COMPLETED }

enum ParticipantRole { ADMIN PLAYER }

enum ParticipantState { ACTIVE DISCONNECTED ELIMINATED }

model LobbyParticipant {
  id          String   @id @default(cuid())
  lobbyId     String
  userId      String
  seatIndex   Int      // 0-3 for players
  role        ParticipantRole
  state       ParticipantState @default(ACTIVE)
  score       Int      @default(0)
  lobby       Lobby    @relation(fields: [lobbyId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  buzzEntries BuzzerAttempt[]
}

model Round {
  id        String   @id @default(cuid())
  lobbyId   String
  index     Int      // 0 or 1
  questions QuestionState[]
  lobby     Lobby    @relation(fields: [lobbyId], references: [id])
}

model Question {
  id          String   @id @default(cuid())
  category    String
  prompt      String
  answer      String
  baseValue   Int
  roundIndex  Int
}

model QuestionState {
  id           String   @id @default(cuid())
  questionId   String
  roundId      String
  status       QuestionLifeCycle @default(UNPLAYED)
  selectedById String?
  resolvedById String?
  value        Int
  question     Question @relation(fields: [questionId], references: [id])
  round        Round    @relation(fields: [roundId], references: [id])
}

enum QuestionLifeCycle { UNPLAYED ACTIVE RESOLVED DISCARDED }

model BuzzerAttempt {
  id              String   @id @default(cuid())
  questionStateId String
  participantId   String
  orderIndex      Int
  result          BuzzerResult @default(PENDING)
  createdAt       DateTime     @default(now())
  questionState   QuestionState @relation(fields: [questionStateId], references: [id])
  participant     LobbyParticipant @relation(fields: [participantId], references: [id])
}

enum BuzzerResult { PENDING CORRECT INCORRECT SKIPPED }

model ScoreEvent {
  id              String   @id @default(cuid())
  participantId   String
  questionStateId String
  delta           Int
  reason          String
  createdAt       DateTime @default(now())
}
```

## 7. API & Echtzeitverhalten
- **REST/Route Handlers**
  - `POST /api/auth/register` – Benutzer anlegen.
  - `POST /api/auth/login` – Session erzeugen (NextAuth).
  - `POST /api/lobbies` – Lobby erstellen (admin auth required).
  - `POST /api/lobbies/join` – per Code beitreten (validiert Sitzanzahl <=4 Spieler).
  - `POST /api/lobbies/:id/rejoin` – Re-attach seat falls disconnect.
  - `GET /api/lobbies/:id` – Lobby + Teilnehmerstatus.
  - `POST /api/questions/seed` – Admin Utility.
- **Socket Events**
  - `connect` → server validiert Session + lobby membership.
  - `lobby:snapshot` – initial state (participants, scores, round).
  - `lobby:update` – seat changes, rejoin.
  - `game:board` – board matrix, disabled cells.
  - `game:select_question` (admin only) → server transitions state, emit `game:question_opened` incl. prompt + answer (answer only to admin via `admin:answer_hint`).
  - `game:timer_tick` – server-sent timer countdown.
  - `player:buzz` – player request; server enqueues, notifies admin, rest of players.
  - `admin:mark` – admin sets `correct|incorrect|closed`; server updates scores, board state, chooses next active player.
  - `video:signal` – WebRTC SDP/ICE exchange.

## 8. Timer & Punkte-Logik
- Timer Owner: server. Node `setTimeout` + persisted `deadline` timestamp; emits tick every 1s to clients.
- When timer expires without buzz/correct, admin prompted to close question.
- **Scoring**:
  - Correct: `+value` to answering participant.
  - Incorrect: `-ceil(value/2)` (half, rounded up) applied immediately.
  - Buzz order ensures previously incorrect players flagged "locked".

## 9. Kamera-/Video-Fluss
1. Beim Lobby-/Game-Beitritt fordert Client Kamera/Mikro-Zugriff.
2. Socket emits `video:ready`; server shares peer list (admin + players max5).
3. `simple-peer` Instanzen erstellen dedizierte `PeerConnection` pro Gegenstelle (mesh).
4. ICE-Server-Liste: `[{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' }]`.
5. Wenn Peer offline → UI zeigt Placeholder + "Rejoin" Button, server markiert Participant als DISCONNECTED; bei Wiederbeitritt Reattach.

## 10. Fehler- & Randfälle
- Mehr als 4 Spieler versuchen zu joinen → API verweigert.
- Admin disconnect → Lobby pausiert, Timer stoppt, UI zeigt "Admin reconnecting".
- Frage wird geöffnet, Spieler disconnect → seat mark "DISCONNECTED"; Timer trotzdem weiter; falls Spieler dran war, Admin kann überspringen.
- Doppel-Buzzer – server akzeptiert nur ersten `PENDING` seat; lock others bis result.

## 11. Open Questions & Annahmen
- Fragenpool kommt initial aus Seed-Datei; später Admin-UI zum Verwalten.
- TURN-Server: Für Produktion sollte eigener bereitgestellt werden; vorerst öffentlicher Dienst.
- Redis optional: Wenn Render Starter ohne Redis, Timer-State in-memory; Toleranz <1 lobby pro Instance.

## 12. Nächste Schritte
1. Next.js + Prisma Projektgerüst erstellen (`pnpm create next-app`, `pnpm dlx prisma init`).
2. Environment-Template (`.env.example`) mit `DATABASE_URL`, `NEXTAUTH_SECRET`, `TURN_*` etc.
3. Auth-Flow und DB-Migrationen implementieren.
4. Lobby/Game APIs + Socket Server.
5. Frontend Screens & Komponenten.
6. Tests + README (inkl. Render Deploy Steps).
