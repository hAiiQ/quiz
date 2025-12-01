"use client";

import { useState, type MouseEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface CopyButtonProps extends ButtonProps {
  value: string;
  successLabel?: string;
}

export function CopyButton({
  value,
  successLabel = "Kopiert!",
  children,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Clipboard fehlgeschlagen", error);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      onClick={handleCopy}
      aria-label="In Zwischenablage kopieren"
      {...props}
    >
      {copied ? successLabel : children}
    </Button>
  );
}
