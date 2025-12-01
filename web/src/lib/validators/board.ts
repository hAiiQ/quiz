import { z } from "zod";

export const boardCodeSchema = z.object({
  code: z.string().length(6),
});

export const selectQuestionSchema = z.object({
  questionStateId: z.string().cuid(),
});

export const resolveQuestionSchema = z.object({
  questionStateId: z.string().cuid(),
  participantId: z.string().cuid().optional(),
  verdict: z.enum(["CORRECT", "INCORRECT", "SKIPPED"]),
});

export type SelectQuestionInput = z.infer<typeof selectQuestionSchema>;
export type ResolveQuestionInput = z.infer<typeof resolveQuestionSchema>;

export const buzzResultSchema = z.object({
  result: z.enum(["CORRECT", "INCORRECT", "SKIPPED"]),
});

export type BuzzResultInput = z.infer<typeof buzzResultSchema>;
