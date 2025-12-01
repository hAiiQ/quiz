import { z } from "zod";

const usernameRegex = /^[a-z0-9_]{3,20}$/i;

export const registerSchema = z
  .object({
    email: z
      .string()
      .email({ message: "Gib eine gültige E-Mail ein." })
      .transform((value) => value.toLowerCase()),
    username: z
      .string()
      .regex(usernameRegex, {
        message: "3-20 Zeichen, nur Buchstaben/Zahlen/Unterstrich",
      })
      .transform((value) => value.toLowerCase()),
    displayName: z
      .string()
      .min(2, "Mindestens 2 Zeichen")
      .max(40, "Maximal 40 Zeichen"),
    password: z
      .string()
      .min(8, "Mindestens 8 Zeichen")
      .max(64, "Maximal 64 Zeichen"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(2, "Pflichtfeld"),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
