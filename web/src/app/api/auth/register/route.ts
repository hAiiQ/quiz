import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validators/auth";

export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null);

    if (!rawBody) {
      return NextResponse.json({ message: "Ungültiger Body" }, { status: 400 });
    }

    const parsed = registerSchema.safeParse(rawBody);

    if (!parsed.success) {
      const error = parsed.error.flatten();
      return NextResponse.json({
        message: error.formErrors[0] ?? "Bitte Eingaben prüfen",
        fieldErrors: error.fieldErrors,
      }, { status: 400 });
    }

    const { email, username, displayName, password } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username }],
      },
    });

    if (existing) {
      return NextResponse.json({ message: "E-Mail oder Username bereits vergeben" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        displayName,
        passwordHash,
      },
    });

    return NextResponse.json({ message: "Account erstellt" });
  } catch (unknownError) {
    console.error("[register]", unknownError);

    if (unknownError instanceof Error && unknownError.message.includes("DATABASE_URL")) {
      return NextResponse.json({ message: "Server-Konfiguration unvollständig. Bitte DATABASE_URL im .env setzen und Datenbank bereitstellen." }, { status: 500 });
    }

    return NextResponse.json({ message: "Registrierung aktuell nicht möglich" }, { status: 500 });
  }
}
