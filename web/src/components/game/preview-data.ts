import { QUESTION_TIMER_SECONDS } from "@/lib/game-config";

export type PreviewQuestionStatus = "UNPLAYED" | "ACTIVE" | "RESOLVED" | "DISCARDED";

export interface PreviewQuestion {
  value: number;
  status: PreviewQuestionStatus;
}

export interface PreviewCategory {
  title: string;
  questions: PreviewQuestion[];
}

export interface PreviewRound {
  label: string;
  categories: PreviewCategory[];
}

export interface PreviewCamera {
  id: string;
  name: string;
  role: "ADMIN" | "PLAYER";
  seatLabel?: string;
  accent: string;
  status: "LIVE" | "READY" | "MUTED" | "OFFLINE";
  isSpeaking?: boolean;
}

export interface PreviewScoreEntry {
  id: string;
  name: string;
  role: "ADMIN" | "PLAYER";
  score: number;
  trend: "+" | "-" | "=";
}

export interface PreviewBuzzEntry {
  id: string;
  name: string;
  status: "PENDING" | "CORRECT" | "INCORRECT";
  note: string;
}

export const previewRounds: PreviewRound[] = [
  {
    label: "Runde 1",
    categories: [
      {
        title: "Wissenschaft",
        questions: [
          { value: 100, status: "RESOLVED" },
          { value: 200, status: "RESOLVED" },
          { value: 300, status: "ACTIVE" },
          { value: 500, status: "UNPLAYED" },
        ],
      },
      {
        title: "Popkultur",
        questions: [
          { value: 100, status: "RESOLVED" },
          { value: 200, status: "RESOLVED" },
          { value: 300, status: "RESOLVED" },
          { value: 500, status: "UNPLAYED" },
        ],
      },
      {
        title: "Europa",
        questions: [
          { value: 100, status: "RESOLVED" },
          { value: 200, status: "ACTIVE" },
          { value: 300, status: "UNPLAYED" },
          { value: 500, status: "UNPLAYED" },
        ],
      },
      {
        title: "Tech",
        questions: [
          { value: 100, status: "RESOLVED" },
          { value: 200, status: "RESOLVED" },
          { value: 300, status: "RESOLVED" },
          { value: 500, status: "RESOLVED" },
        ],
      },
      {
        title: "Geschichte",
        questions: [
          { value: 100, status: "UNPLAYED" },
          { value: 200, status: "UNPLAYED" },
          { value: 300, status: "UNPLAYED" },
          { value: 500, status: "UNPLAYED" },
        ],
      },
      {
        title: "Wildcard",
        questions: [
          { value: 100, status: "RESOLVED" },
          { value: 200, status: "RESOLVED" },
          { value: 300, status: "UNPLAYED" },
          { value: 500, status: "UNPLAYED" },
        ],
      },
    ],
  },
  {
    label: "Runde 2 (Double)",
    categories: [
      {
        title: "Future",
        questions: [
          { value: 200, status: "UNPLAYED" },
          { value: 400, status: "UNPLAYED" },
          { value: 600, status: "UNPLAYED" },
          { value: 1000, status: "UNPLAYED" },
        ],
      },
      {
        title: "Cities",
        questions: [
          { value: 200, status: "UNPLAYED" },
          { value: 400, status: "UNPLAYED" },
          { value: 600, status: "UNPLAYED" },
          { value: 1000, status: "UNPLAYED" },
        ],
      },
      {
        title: "Literatur",
        questions: [
          { value: 200, status: "UNPLAYED" },
          { value: 400, status: "UNPLAYED" },
          { value: 600, status: "UNPLAYED" },
          { value: 1000, status: "UNPLAYED" },
        ],
      },
      {
        title: "Mathe",
        questions: [
          { value: 200, status: "UNPLAYED" },
          { value: 400, status: "UNPLAYED" },
          { value: 600, status: "UNPLAYED" },
          { value: 1000, status: "UNPLAYED" },
        ],
      },
      {
        title: "Serien",
        questions: [
          { value: 200, status: "UNPLAYED" },
          { value: 400, status: "UNPLAYED" },
          { value: 600, status: "UNPLAYED" },
          { value: 1000, status: "UNPLAYED" },
        ],
      },
      {
        title: "Wildcard",
        questions: [
          { value: 200, status: "UNPLAYED" },
          { value: 400, status: "UNPLAYED" },
          { value: 600, status: "UNPLAYED" },
          { value: 1000, status: "UNPLAYED" },
        ],
      },
    ],
  },
];

export const previewActiveQuestion = {
  category: "Wissenschaft",
  prompt: "Dieses Teilchenmodell erklärt, weshalb Nordlichter entstehen.",
  answer: "Was sind Sonnenstürme?",
  value: 300,
  remainingSeconds: QUESTION_TIMER_SECONDS - 12,
};

export const previewCameras: PreviewCamera[] = [
  {
    id: "cam-admin",
    name: "Mia (Host)",
    role: "ADMIN",
    accent: "from-purple-500/60 to-fuchsia-500/30",
    status: "LIVE",
    isSpeaking: true,
  },
  {
    id: "cam-1",
    name: "Alex",
    role: "PLAYER",
    seatLabel: "Spieler 1",
    accent: "from-blue-500/40 to-cyan-500/10",
    status: "READY",
  },
  {
    id: "cam-2",
    name: "Lena",
    role: "PLAYER",
    seatLabel: "Spielerin 2",
    accent: "from-emerald-500/40 to-teal-500/10",
    status: "LIVE",
    isSpeaking: false,
  },
  {
    id: "cam-3",
    name: "Mo",
    role: "PLAYER",
    seatLabel: "Spieler 3",
    accent: "from-amber-500/40 to-orange-500/10",
    status: "MUTED",
  },
  {
    id: "cam-4",
    name: "Sven",
    role: "PLAYER",
    seatLabel: "Spieler 4",
    accent: "from-rose-500/40 to-pink-500/10",
    status: "READY",
  },
];

export const previewScores: PreviewScoreEntry[] = [
  { id: "p1", name: "Lena", role: "PLAYER", score: 2600, trend: "+" },
  { id: "p2", name: "Alex", role: "PLAYER", score: 2100, trend: "=" },
  { id: "p3", name: "Mo", role: "PLAYER", score: 1400, trend: "-" },
  { id: "p4", name: "Sven", role: "PLAYER", score: 1200, trend: "=" },
];

export const previewBuzzQueue: PreviewBuzzEntry[] = [
  { id: "b1", name: "Lena", status: "PENDING", note: "Antwort wartet" },
  { id: "b2", name: "Alex", status: "INCORRECT", note: "-150 Punkte" },
  { id: "b3", name: "Mo", status: "CORRECT", note: "+300 Punkte" },
];
