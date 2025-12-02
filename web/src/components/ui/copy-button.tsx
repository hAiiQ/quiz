"use client";

import { useState, type MouseEvent } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

type CopyButtonProps = Omit<ButtonProps, "onClick"> & {
  value: string;
  successLabel?: string;
  onCopied?: () => void;
};

export function CopyButton({
  value,
  successLabel = "Kopiert!",
  children,
  onCopied,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      onCopied?.();
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
