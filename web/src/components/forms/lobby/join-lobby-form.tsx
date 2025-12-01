"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinLobbySchema, type JoinLobbyInput } from "@/lib/validators/lobby";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";

export function JoinLobbyForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinLobbyInput>({
    resolver: zodResolver(joinLobbySchema),
    defaultValues: { code: "" },
  });

  const onSubmit = (values: JoinLobbyInput) => {
    setServerError(null);
    startTransition(async () => {
      const res = await fetch("/api/lobbies/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json().catch(() => ({ message: "Fehler" }));
      if (!res.ok) {
        setServerError(data.message ?? "Beitritt fehlgeschlagen");
        return;
      }

      router.push(`/lobby/${data.lobby.code}`);
      router.refresh();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="lobby-code">Lobby-Code</Label>
        <Input id="lobby-code" placeholder="z. B. ABC123" {...register("code")} />
        {errors.code && <p className="text-sm text-red-300">{errors.code.message}</p>}
      </div>
      {serverError && <InlineAlert variant="error" message={serverError} />}
      <Button type="submit" className="w-full" isLoading={isPending}>
        Beitreten
      </Button>
    </form>
  );
}
