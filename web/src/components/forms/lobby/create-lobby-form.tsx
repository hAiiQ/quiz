"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createLobbySchema,
  type CreateLobbyInput,
} from "@/lib/validators/lobby";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";

export function CreateLobbyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLobbyInput>({
    resolver: zodResolver(createLobbySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = (values: CreateLobbyInput) => {
    setServerError(null);
    startTransition(async () => {
      const res = await fetch("/api/lobbies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Fehler" }));
        setServerError(data.message ?? "Lobby konnte nicht erstellt werden");
        return;
      }

      reset();
      const data = await res.json();
      router.push(`/lobby/${data.lobby.code}`);
      router.refresh();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="lobby-name">Lobby-Name</Label>
        <Input id="lobby-name" placeholder="z. B. Freitag Abend Quiz" {...register("name")} />
        {errors.name && <p className="text-sm text-red-300">{errors.name.message}</p>}
      </div>
      {serverError && <InlineAlert variant="error" message={serverError} />}
      <Button type="submit" className="w-full" isLoading={isPending}>
        Lobby erstellen
      </Button>
    </form>
  );
}
