import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format money with .000đ suffix (Vietnamese dong style)
export function formatMoney(amount: number): string {
  return `${amount.toLocaleString()}.000đ`;
}

// Format money without currency symbol
export function formatMoneyNumber(amount: number): string {
  return `${amount.toLocaleString()}.000`;
}
