import Link from "next/link";
import { AuthCard } from "@/components/forms/auth/auth-card";
import { RegisterForm } from "@/components/forms/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="w-full max-w-lg">
      <AuthCard
        title="Account erstellen"
        subtitle="Erstelle deinen Admin- oder Spielerzugang für Quizduell."
      >
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-white/70">
          Bereits registriert?{" "}
          <Link className="text-purple-300 underline" href="/login">
            Zum Login
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
