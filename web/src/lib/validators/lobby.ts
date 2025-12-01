import { z } from "zod";

export const createLobbySchema = z.object({
  name: z.string().min(3, "Mindestens 3 Zeichen").max(50, "Maximal 50 Zeichen"),
});

export const joinLobbySchema = z.object({
  code: z
    .string()
    .min(4, "Code zu kurz")
    .max(8, "Code zu lang")
    .regex(/^[A-Z0-9]+$/i, "Nur Buchstaben/Zahlen"),
});

export type CreateLobbyInput = z.infer<typeof createLobbySchema>;
export type JoinLobbyInput = z.infer<typeof joinLobbySchema>;
