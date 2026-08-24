"use client";

import { useState } from "react";
import { useBalanceSheet } from "@/lib/store";
import { CURRENCIES } from "@/lib/currencies";
import { fetchLatestRates } from "@/lib/fx";
import type { RateInfo } from "@/lib/types";
import { CurrencySelect } from "@/components/CurrencySelect";
import { RateRow } from "@/components/RateRow";
import { ImportExport } from "@/components/ImportExport";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-3 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const {
    data,
    setBaseCurrency,
    toggleCurrency,
    setRate,
    setRates,
  } = useBalanceSheet();

  const [fetchingAll, setFetchingAll] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const enabledSet = new Set(data.enabledCurrencies);
  const quoteCurrencies = data.enabledCurrencies
    .filter((c) => c !== data.baseCurrency)
    .sort();

  async function fetchAll() {
    setFetchingAll(true);
    setFetchError(null);
    try {
      const rates = await fetchLatestRates(data.baseCurrency, quoteCurrencies);
      const next: Record<string, RateInfo> = {};
      for (const [currency, rate] of Object.entries(rates)) {
        next[currency] = { rate, source: "api", updatedAt: Date.now() };
      }
      setRates(next);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to fetch rates");
    } finally {
      setFetchingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Section title="Base currency">
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
          All totals are converted into this currency using the rates below.
        </p>
        <div className="max-w-xs">
          <CurrencySelect
            value={data.baseCurrency}
            onChange={setBaseCurrency}
          />
        </div>
      </Section>

      <Section title="Currencies">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Enable or disable currencies. Disabled currencies are excluded from
          totals and the exchange-rate table.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CURRENCIES.map((c) => {
            const isBase = c.code === data.baseCurrency;
            const enabled = enabledSet.has(c.code);
            return (
              <label
                key={c.code}
                className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${
                  isBase
                    ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950"
                    : "border-zinc-200 dark:border-zinc-800"
                } ${isBase ? "" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={isBase}
                  onChange={() => toggleCurrency(c.code)}
                  className="accent-blue-600"
                />
                <span>
                  <span className="font-medium">{c.code}</span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {c.name}
                  </span>
                </span>
                {isBase && (
                  <span className="ml-auto text-xs font-medium text-blue-600 dark:text-blue-400">
                    base
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Exchange rates">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Rates are expressed as 1 {data.baseCurrency} = X currency.
          </p>
          <button
            onClick={fetchAll}
            disabled={fetchingAll || quoteCurrencies.length === 0}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {fetchingAll ? "Fetching…" : "Fetch all latest"}
          </button>
        </div>
        {fetchError && (
          <p className="mb-2 text-sm text-red-500">{fetchError}</p>
        )}
        {quoteCurrencies.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No other currencies enabled.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {quoteCurrencies.map((c) => (
              <RateRow
                key={c}
                currency={c}
                baseCurrency={data.baseCurrency}
                info={data.rates[c]}
                onSetRate={setRate}
              />
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-zinc-400">
          Latest rates are fetched from Frankfurter (frankfurter.dev), a free
          public API. You can also enter rates manually.
        </p>
      </Section>

      <Section title="Import / Export">
        <ImportExport />
      </Section>
    </div>
  );
}
