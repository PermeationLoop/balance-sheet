import type { AppData, Entry, RateInfo } from "./types";

const STORAGE_KEY = "balance-sheet:data:v1";

export function defaultData(): AppData {
  return {
    version: 1,
    baseCurrency: "USD",
    enabledCurrencies: ["USD", "EUR", "GBP"],
    rates: {},
    entries: [],
  };
}

export const EMPTY_DATA: AppData = defaultData();

function isEntry(value: unknown): value is Entry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.type === "string" &&
    typeof v.name === "string" &&
    Array.isArray(v.holdings)
  );
}

export function normalize(value: unknown): AppData | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Partial<AppData>;
  if (v.version !== 1) return null;

  const base = defaultData();
  const baseCurrency =
    typeof v.baseCurrency === "string" ? v.baseCurrency : base.baseCurrency;
  const enabledCurrencies = Array.isArray(v.enabledCurrencies)
    ? v.enabledCurrencies.filter((c): c is string => typeof c === "string")
    : base.enabledCurrencies;
  const rates =
    typeof v.rates === "object" && v.rates !== null
      ? (v.rates as Record<string, RateInfo>)
      : {};
  const entries = Array.isArray(v.entries) ? v.entries.filter(isEntry) : [];

  if (!enabledCurrencies.includes(baseCurrency)) {
    enabledCurrencies.push(baseCurrency);
  }

  return {
    version: 1,
    baseCurrency,
    enabledCurrencies,
    rates,
    entries,
  };
}

export function loadData(): AppData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalize(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage may be unavailable (private mode / quota). Ignore.
  }
}

// --- External store (for useSyncExternalStore) ---

let cache: AppData | null = null;
const listeners = new Set<() => void>();

export function getSnapshot(): AppData {
  if (cache === null) {
    cache = loadData() ?? defaultData();
  }
  return cache;
}

export function getServerSnapshot(): AppData {
  return EMPTY_DATA;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setData(next: AppData): void {
  cache = next;
  saveData(next);
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cache = loadData() ?? defaultData();
      listeners.forEach((l) => l());
    }
  });
}

export function serialize(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseImport(text: string): AppData | null {
  try {
    return normalize(JSON.parse(text));
  } catch {
    return null;
  }
}

export function downloadExport(data: AppData): void {
  const blob = new Blob([serialize(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `balance-sheet-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
