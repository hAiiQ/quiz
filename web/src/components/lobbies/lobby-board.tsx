"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn, formatPoints } from "@/lib/utils";
import { QUESTION_TIMER_SECONDS } from "@/lib/game-config";

type QuestionStatus = "UNPLAYED" | "ACTIVE" | "RESOLVED" | "DISCARDED";

type BuzzAttempt = {
  id: string;
  participantId: string;
  orderIndex: number;
  result: "PENDING" | "CORRECT" | "INCORRECT" | "SKIPPED";
  participant: {
    id: string;
    role: "ADMIN" | "PLAYER";
    user: {
      id: string;
      username: string;
      displayName: string;
    };
  };
};

type LobbyBoardQuestion = {
  id: string;
  questionId: string;
  value: number;
  status: QuestionStatus;
  roundIndex: number;
  activatedAt: string | null;
  timerEndsAt: string | null;
  question: {
    id: string;
    prompt: string;
    answer: string;
    category: string;
    categoryIndex: number;
    baseValue: number;
  };
  buzzAttempts: BuzzAttempt[];
};

type LobbyBoardCategory = {
  category: string;
  categoryIndex: number;
  questions: LobbyBoardQuestion[];
};

type LobbyBoardRound = {
  roundIndex: number;
  categories: LobbyBoardCategory[];
};

type BoardParticipant = {
  id: string;
  userId: string;
  role: "ADMIN" | "PLAYER";
  score: number;
  seatIndex: number | null;
  state: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
};

type LobbyBoardResponse = {
  board: LobbyBoardRound[];
  participants: BoardParticipant[];
};

type ScoreEvent = {
  id: string;
  delta: number;
  reason: string;
  createdAt: string;
  participant: {
    id: string;
    seatIndex: number | null;
    displayName: string;
  };
  question: {
    id: string;
    category: string;
    value: number;
  } | null;
};

interface LobbyBoardProps {
  code: string;
  isAdmin: boolean;
  selfParticipantId: string;
}

export function LobbyBoard({ code, isAdmin, selfParticipantId }: LobbyBoardProps) {
  const [adminError, setAdminError] = useState<string | null>(null);
  const [buzzError, setBuzzError] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const queryClient = useQueryClient();

  const invalidateBoard = () =>
    queryClient.invalidateQueries({ queryKey: ["board", code] }).catch(() => null);

  const { data, isLoading, isFetching, error } = useQuery<LobbyBoardResponse>({
    queryKey: ["board", code],
    queryFn: async () => {
      const response = await fetch(`/api/lobbies/${code}/board`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Board konnte nicht geladen werden");
      }
      return (await response.json()) as LobbyBoardResponse;
    },
    refetchInterval: 5_000,
  });

  const scoreEventsQuery = useQuery<{ events: ScoreEvent[] }>({
    queryKey: ["score-events", code],
    queryFn: async () => {
      const response = await fetch(`/api/lobbies/${code}/score-events`, { cache: "no-store" });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Score Events konnten nicht geladen werden");
      }
      return (await response.json()) as { events: ScoreEvent[] };
    },
    refetchInterval: 5_000,
  });

  const selectQuestionMutation = useMutation({
    mutationFn: async (questionStateId: string) => {
      const response = await fetch(`/api/lobbies/${code}/board/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionStateId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Frage konnte nicht aktiviert werden");
      }
    },
    onSuccess: () => {
      invalidateBoard();
      setAdminError(null);
    },
    onError: (mutationError: unknown) => {
      setAdminError(mutationError instanceof Error ? mutationError.message : String(mutationError));
    },
  });

  const buzzMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/lobbies/${code}/board/buzz`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Buzz konnte nicht gesendet werden");
      }
    },
    onSuccess: () => {
      invalidateBoard();
      setBuzzError(null);
    },
    onError: (mutationError: unknown) => {
      setBuzzError(mutationError instanceof Error ? mutationError.message : String(mutationError));
    },
  });

  const buzzResultMutation = useMutation({
    mutationFn: async ({
      attemptId,
      result,
    }: {
      attemptId: string;
      result: "CORRECT" | "INCORRECT" | "SKIPPED";
    }) => {
      const response = await fetch(`/api/lobbies/${code}/board/buzz/${attemptId}/result`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ result }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Buzz konnte nicht ausgewertet werden");
      }
    },
    onSuccess: () => {
      invalidateBoard();
      setAdminError(null);
    },
    onError: (mutationError: unknown) => {
      setAdminError(mutationError instanceof Error ? mutationError.message : String(mutationError));
    },
  });

  const skipQuestionMutation = useMutation({
    mutationFn: async (questionStateId: string) => {
      const response = await fetch(`/api/lobbies/${code}/board/resolve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questionStateId, verdict: "SKIPPED" }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? "Frage konnte nicht verworfen werden");
      }
    },
    onSuccess: () => {
      invalidateBoard();
      setAdminError(null);
    },
    onError: (mutationError: unknown) => {
      setAdminError(mutationError instanceof Error ? mutationError.message : String(mutationError));
    },
  });

  const rounds = data?.board ?? [];
  const allQuestions = rounds.flatMap((round) =>
    round.categories.flatMap((category) => category.questions),
  );
  const activeQuestion = allQuestions.find((question) => question.status === "ACTIVE") ?? null;
  const leaderboard = [...(data?.participants ?? [])].sort((a, b) => b.score - a.score);
  const selfParticipant = data?.participants.find((participant) => participant.id === selfParticipantId) ?? null;
  const hasBuzzed = Boolean(
    activeQuestion?.buzzAttempts.some((attempt) => attempt.participantId === selfParticipantId),
  );
  const nextPendingAttempt = activeQuestion?.buzzAttempts.find(
    (attempt) => attempt.result === "PENDING",
  );

  useEffect(() => {
    function updateTimer() {
      if (!activeQuestion?.timerEndsAt) {
        setTimeLeftMs(0);
        return;
      }
      const diff = new Date(activeQuestion.timerEndsAt).getTime() - Date.now();
      setTimeLeftMs(Math.max(0, diff));
    }

    updateTimer();
    const interval = window.setInterval(updateTimer, 250);
    return () => window.clearInterval(interval);
  }, [activeQuestion?.timerEndsAt]);

  const timerSeconds = Math.ceil(timeLeftMs / 1000);
  const timerProgress = Math.min(
    100,
    Math.max(0, (timeLeftMs / (QUESTION_TIMER_SECONDS * 1000)) * 100),
  );
  const canBuzz = Boolean(
    !isAdmin &&
      selfParticipant &&
      selfParticipant.role === "PLAYER" &&
      selfParticipant.state === "ACTIVE" &&
      activeQuestion &&
      activeQuestion.status === "ACTIVE" &&
      !hasBuzzed &&
      timerSeconds > 0,
  );

  const handleSelectQuestion = (questionStateId: string) => {
    if (!isAdmin || selectQuestionMutation.isPending) return;
    selectQuestionMutation.mutate(questionStateId);
  };

  const handleBuzz = () => {
    if (!canBuzz || buzzMutation.isPending) {
      return;
    }
    setBuzzError(null);
    buzzMutation.mutate();
  };

  const handleAttemptResult = (attemptId: string, result: "CORRECT" | "INCORRECT" | "SKIPPED") => {
    if (!isAdmin || buzzResultMutation.isPending) return;
    setAdminError(null);
    buzzResultMutation.mutate({ attemptId, result });
  };

  const handleSkipQuestion = () => {
    if (!isAdmin || !activeQuestion || skipQuestionMutation.isPending) return;
    setAdminError(null);
    skipQuestionMutation.mutate(activeQuestion.id);
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-white/10 bg-black/30 p-6 text-center text-white/70">
        Lade Board...
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 text-center text-red-100">
        {(error as Error)?.message ?? "Board konnte nicht geladen werden"}
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-black/40 p-6">
      <div className="flex flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-purple-200">Spielbrett</p>
            <h2 className="text-2xl font-semibold text-white">Live-Jeopardy</h2>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/70">
            {isFetching && <span className="text-purple-200">Aktualisiere…</span>}
            <Button variant="secondary" size="sm" onClick={invalidateBoard}>
              Aktualisieren
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            {data.board.map((round) => (
              <div key={round.roundIndex} className="space-y-4">
                <div className="flex items-center justify-between text-white/70">
                  <h3 className="text-xl font-semibold text-white">
                    Runde {round.roundIndex + 1}
                  </h3>
                  <span className="text-xs font-mono uppercase tracking-[0.3em] text-white/50">
                    {round.categories.length} Kategorien
                  </span>
                </div>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${round.categories.length}, minmax(0, 1fr))` }}
                >
                  {round.categories.map((category) => (
                    <div
                      key={`${round.roundIndex}-${category.categoryIndex}`}
                      className="rounded-2xl border border-white/10 bg-white/5 p-3"
                    >
                      <div className="pb-2 text-center text-sm font-semibold uppercase tracking-wide text-white">
                        {category.category}
                      </div>
                      <div className="space-y-2">
                        {category.questions.map((question) => (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => handleSelectQuestion(question.id)}
                            disabled={!isAdmin || question.status !== "UNPLAYED"}
                            className={cn(
                              "flex w-full items-center justify-center rounded-xl border px-3 py-4 text-lg font-bold transition",
                              question.status === "UNPLAYED" &&
                                "border-purple-500/30 bg-purple-700/20 text-purple-100 hover:bg-purple-600/30",
                              question.status === "ACTIVE" &&
                                "border-yellow-400/50 bg-yellow-500/20 text-yellow-100 animate-pulse",
                              question.status === "RESOLVED" &&
                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
                              question.status === "DISCARDED" &&
                                "border-white/10 bg-black/40 text-white/30 line-through",
                              (!isAdmin || question.status !== "UNPLAYED") && "cursor-not-allowed",
                            )}
                          >
                            {question.status === "UNPLAYED" && question.value}
                            {question.status === "ACTIVE" && "AKTIV"}
                            {question.status === "RESOLVED" && "✓"}
                            {question.status === "DISCARDED" && "—"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
              <p className="text-sm text-white/60">Live-Stand mit Punktzahl</p>
              <div className="mt-4 space-y-3">
                {leaderboard.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{participant.user.displayName}</p>
                      <p className="text-xs text-white/50">{participant.role === "ADMIN" ? "Admin" : "Spieler"}</p>
                    </div>
                    <p className="font-mono text-sm text-white/80">{formatPoints(participant.score)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-semibold text-white">Score Feed</h3>
              <p className="text-sm text-white/60">Letzte Aktionen</p>
              <div className="mt-4 space-y-3">
                {(scoreEventsQuery.data?.events ?? []).length === 0 ? (
                  <p className="text-xs text-white/60">Noch keine Score-Events.</p>
                ) : (
                  (scoreEventsQuery.data?.events ?? []).map((event) => (
                    <div key={event.id} className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{event.participant.displayName}</p>
                        <span
                          className={cn(
                            "font-mono",
                            event.delta >= 0 ? "text-emerald-300" : "text-red-300",
                          )}
                        >
                          {formatPoints(event.delta)}
                        </span>
                      </div>
                      {event.question && (
                        <p className="text-xs text-white/50">
                          {event.question.category} · {event.question.value} Punkte
                        </p>
                      )}
                      <p className="text-xs text-white/40">
                        {new Date(event.createdAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-lg font-semibold text-white">Aktive Frage</h3>
              {activeQuestion ? (
                <div className="mt-3 space-y-4 text-white/90">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {activeQuestion.question.category}
                    </p>
                    <p className="text-sm font-semibold text-white">{activeQuestion.question.prompt}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <span>Timer</span>
                      <span className="font-mono">
                        {timerSeconds > 0 ? `${timerSeconds}s` : "Zeit abgelaufen"}
                      </span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-200 transition-all",
                          timerSeconds === 0 && "bg-red-400",
                        )}
                        style={{ width: `${timerProgress}%` }}
                      />
                    </div>
                    {timerSeconds === 0 && (
                      <p className="mt-1 text-xs text-red-300">Zeit ist abgelaufen – Buzzers gesperrt.</p>
                    )}
                  </div>
                  {isAdmin ? (
                    <p className="text-xs text-white/50">Antwort: {activeQuestion.question.answer}</p>
                  ) : (
                    <p className="text-xs text-white/60">Antwort wird vom Host präsentiert.</p>
                  )}

                  {!isAdmin && (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        onClick={handleBuzz}
                        disabled={!canBuzz || buzzMutation.isPending}
                      >
                        {hasBuzzed ? "Buzz gespeichert" : "Buzzern"}
                      </Button>
                      <p className="text-xs text-white/60">
                        {activeQuestion
                          ? hasBuzzed
                            ? "Du stehst in der Queue – warte auf die Admin-Entscheidung."
                            : "Klicke, sobald du antworten möchtest."
                          : "Noch keine Frage aktiv."}
                      </p>
                      {buzzError && <p className="text-xs text-red-300">{buzzError}</p>}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                          Buzz-Queue
                        </p>
                        <div className="mt-2 space-y-2">
                          {activeQuestion.buzzAttempts.length ? (
                            activeQuestion.buzzAttempts.map((attempt) => {
                              const statusLabel: Record<BuzzAttempt["result"], string> = {
                                PENDING: "Wartet",
                                CORRECT: "Korrekt",
                                INCORRECT: "Falsch",
                                SKIPPED: "Skip",
                              };
                              const statusTone: Record<BuzzAttempt["result"], string> = {
                                PENDING: "text-yellow-200",
                                CORRECT: "text-emerald-200",
                                INCORRECT: "text-red-200",
                                SKIPPED: "text-white/60",
                              };
                              const isFirstPending =
                                attempt.result === "PENDING" && attempt.id === nextPendingAttempt?.id;
                              return (
                                <div
                                  key={attempt.id}
                                  className={cn(
                                    "rounded-xl border px-3 py-2 text-sm",
                                    attempt.result === "CORRECT" && "border-emerald-400/40 bg-emerald-500/10",
                                    attempt.result === "INCORRECT" && "border-red-400/40 bg-red-500/10",
                                    attempt.result === "SKIPPED" && "border-white/20 bg-white/5",
                                    attempt.result === "PENDING" && "border-yellow-400/40 bg-yellow-500/10",
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div>
                                      <p className="font-semibold text-white">
                                        {attempt.participant.user.displayName}
                                      </p>
                                      <p className="text-xs text-white/60">
                                        Buzz #{attempt.orderIndex + 1}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={cn("text-xs font-mono", statusTone[attempt.result])}>
                                        {statusLabel[attempt.result]}
                                      </span>
                                      {isFirstPending && (
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            onClick={() => handleAttemptResult(attempt.id, "CORRECT")}
                                            disabled={buzzResultMutation.isPending}
                                          >
                                            ✓
                                          </Button>
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => handleAttemptResult(attempt.id, "INCORRECT")}
                                            disabled={buzzResultMutation.isPending}
                                          >
                                            ✕
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleAttemptResult(attempt.id, "SKIPPED")}
                                            disabled={buzzResultMutation.isPending}
                                          >
                                            ···
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-white/60">Noch keine Buzzers eingegangen.</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSkipQuestion}
                        disabled={skipQuestionMutation.isPending}
                      >
                        Frage schließen
                      </Button>
                      {adminError && <p className="text-xs text-red-300">{adminError}</p>}
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-white/60">Noch keine aktive Frage.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
