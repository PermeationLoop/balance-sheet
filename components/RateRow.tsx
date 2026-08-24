"use client";

import { useState } from "react";
import type { RateInfo } from "@/lib/types";
import { fetchLatestRates } from "@/lib/fx";
import { formatDate } from "@/lib/format";

interface RateRowProps {
  currency: string;
  baseCurrency: string;
  info?: RateInfo;
  onSetRate: (currency: string, rate: number, source: "manual" | "api") => void;
}

export function RateRow({ currency, baseCurrency, info, onSetRate }: RateRowProps) {
  const [value, setValue] = useState(
    info && info.rate ? String(info.rate) : "",
  );
  const [lastRate, setLastRate] = useState<number | undefined>(info?.rate);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (info && lastRate !== info.rate) {
    setLastRate(info.rate);
    setValue(info.rate ? String(info.rate) : "");
    setError(null);
  }

  function commitManual(next: string) {
    setValue(next);
    const num = parseFloat(next);
    if (Number.isFinite(num) && num > 0) {
      onSetRate(currency, num, "manual");
    }
  }

  async function fetchRate() {
    setBusy(true);
    setError(null);
    try {
      const rates = await fetchLatestRates(baseCurrency, [currency]);
      const rate = rates[currency];
      if (typeof rate === "number") {
        onSetRate(currency, rate, "api");
      } else {
        setError("No rate returned");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-20 shrink-0 text-sm font-medium">{currency}</div>
      <div className="text-xs text-zinc-400">
        1 {baseCurrency} =
      </div>
      <input
        type="number"
        step="any"
        inputMode="decimal"
        value={value}
        onChange={(e) => commitManual(e.target.value)}
        placeholder="Rate"
        className="w-32 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <button
        onClick={fetchRate}
        disabled={busy}
        className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {busy ? "Fetching…" : "Fetch latest"}
      </button>
      <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
        {info && (
          <>
            <span
              className={`rounded-full px-2 py-0.5 ${
                info.source === "api"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {info.source}
            </span>
            <span className="hidden sm:inline">{formatDate(info.updatedAt)}</span>
          </>
        )}
        {error && <span className="text-red-500">{error}</span>}
      </div>
    </div>
  );
}
