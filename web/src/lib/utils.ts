import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function parseNumericInput(value: string): number {
  const cleaned = value.replace(/[$,]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatNumberWithCommas(value: number | string): string {
  const num = typeof value === "string" ? parseNumericInput(value) : value;
  if (num === 0) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(num);
}
