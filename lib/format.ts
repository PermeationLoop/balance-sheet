import { getCurrency } from "./currencies";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function formatMoney(amount: number, currency: string): string {
  const info = getCurrency(currency);
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    formatted = amount.toFixed(2);
  }
  return `${info.symbol} ${formatted}`.trim();
}

export function formatNumber(amount: number): string {
  try {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
}

export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}
