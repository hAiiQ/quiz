import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge conditional class names while preventing duplicate Tailwind tokens.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format points consistently, keeping the sign visible.
 */
export function formatPoints(value: number) {
  const formatter = new Intl.NumberFormat("de-DE", {
    signDisplay: "always",
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}
