"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineAlert } from "@/components/feedback/inline-alert";

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: RegisterInput) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({ message: "Unbekannter Fehler" }));
          setServerError(data.message ?? "Registrierung fehlgeschlagen");
          return;
        }

        const loginResult = await signIn("credentials", {
          identifier: values.email,
          password: values.password,
          redirect: false,
        });

        if (loginResult?.error) {
          router.push("/login");
          return;
        }

        router.push("/lobby");
        router.refresh();
      } catch (err) {
        console.error(err);
        setServerError("Server nicht erreichbar. Versuche es erneut.");
      }
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-300">{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" autoComplete="username" {...register("username")} />
        {errors.username && <p className="text-sm text-red-300">{errors.username.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="displayName">Anzeigename</Label>
        <Input id="displayName" {...register("displayName")} />
        {errors.displayName && <p className="text-sm text-red-300">{errors.displayName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
        <Input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-red-300">{errors.confirmPassword.message}</p>
        )}
      </div>
      {serverError && <InlineAlert variant="error" message={serverError} />}
      <Button type="submit" className="w-full" isLoading={isPending}>
        Account erstellen
      </Button>
    </form>
  );
}
