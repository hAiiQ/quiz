import Link from "next/link";
import { AuthCard } from "@/components/forms/auth/auth-card";
import { LoginForm } from "@/components/forms/auth/login-form";

export default function LoginPage() {
  return (
    <div className="w-full max-w-lg">
      <AuthCard title="Willkommen zurück" subtitle="Melde dich an, um in deine Lobby zu starten.">
        <LoginForm />
        <p className="mt-6 text-center text-sm text-white/70">
          Kein Account?{" "}
          <Link className="text-purple-300 underline" href="/register">
            Jetzt registrieren
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
