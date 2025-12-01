import { z } from "zod";

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  TURN_URL: z.string().min(1),
  TURN_USERNAME: z.string().min(1),
  TURN_CREDENTIAL: z.string().min(1),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SOCKET_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Quizduell"),
});

type ServerEnv = z.infer<typeof serverSchema>;
type ClientEnv = z.infer<typeof clientSchema>;

let cachedServerEnv: ServerEnv | null = null;

function formatEnvErrors(error: z.ZodError) {
  const { fieldErrors, formErrors } = error.flatten();
  const fieldMessages = Object.entries(fieldErrors)
    .map(([key, value]) => `${key}: ${value?.join(", ")}`)
    .join("\n");
  return [formErrors.join("\n"), fieldMessages].filter(Boolean).join("\n");
}

export function getServerEnv(): ServerEnv {
  if (cachedServerEnv) return cachedServerEnv;
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Server environment variables are invalid:\n${formatEnvErrors(parsed.error)}`);
  }
  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

export function getClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "Quizduell",
  });
  if (!parsed.success) {
    throw new Error(`Client environment variables are invalid:\n${formatEnvErrors(parsed.error)}`);
  }
  return parsed.data;
}
