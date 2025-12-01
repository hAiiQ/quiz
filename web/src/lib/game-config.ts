export const MAX_PLAYERS = 4;
export const ROUND_VALUES = [
  [100, 200, 300, 500],
  [200, 400, 600, 1000],
] as const;
export const QUESTION_TIMER_SECONDS = 30;
export const MAX_VIDEO_PARTICIPANTS = MAX_PLAYERS + 1; // players + admin

export type RoundIndex = 0 | 1;

export function getValueForRound(round: RoundIndex, columnIndex: number) {
  const values = ROUND_VALUES[round];
  return values[columnIndex] ?? values[values.length - 1];
}
