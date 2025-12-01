"use client";

import { cn } from "@/lib/utils";

interface InlineAlertProps {
  variant?: "error" | "success" | "info";
  message: string;
}

const variantStyles: Record<Required<InlineAlertProps>["variant"], string> = {
  error: "border-red-400/60 bg-red-500/10 text-red-200",
  success: "border-emerald-400/60 bg-emerald-500/10 text-emerald-100",
  info: "border-white/20 bg-white/5 text-white",
};

export function InlineAlert({ variant = "info", message }: InlineAlertProps) {
  if (!message) return null;
  return (
    <div className={cn("w-full rounded-2xl border px-4 py-2 text-sm", variantStyles[variant])}>
      {message}
    </div>
  );
}
