"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-purple-500/90 text-white hover:bg-purple-400 focus-visible:ring-purple-300 disabled:bg-purple-700/50",
  secondary:
    "bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white/40 disabled:bg-white/5",
  ghost: "text-white/80 hover:text-white hover:bg-white/10 focus-visible:ring-white/20",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        variantMap[variant],
        sizeMap[size],
        isLoading && "cursor-wait opacity-70",
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? "Bitte warten..." : children}
    </button>
  ),
);

Button.displayName = "Button";
