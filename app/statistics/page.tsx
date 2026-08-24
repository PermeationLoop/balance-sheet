"use client";

import { useMemo, useState, useEffect } from "react";
import { useBalanceSheet } from "@/lib/store";
import { computeStats } from "@/lib/compute";
import {
  ENTRY_CATEGORY,
  ENTRY_TYPE_LABELS,
  isLiability,
  type EntryType,
} from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/format";
import { CurrencySelect } from "@/components/CurrencySelect";

export default function StatisticsPage() {
  const { data } = useBalanceSheet();
  // 1. Safely read the initial value (or fallback to a default like 'USD')
  const [displayCurrency, setDisplayCurrency] = useState(() => data?.baseCurrency || 'USD');

  // 2. Track the last currency we successfully synchronized from the data
  const [prevBaseCurrency, setPrevBaseCurrency] = useState(data?.baseCurrency);

  // 3. Update state during render when the async data finally arrives
  if (data?.baseCurrency !== prevBaseCurrency) {
    setPrevBaseCurrency(data?.baseCurrency);
    setDisplayCurrency(data?.baseCurrency);
  }

  const stats = useMemo(() => computeStats(data), [data]);

  const currencies = Object.keys(stats.perCurrency)
    .filter(
      (code) =>
        stats.perCurrency[code].asset > 0 ||
        stats.perCurrency[code].liability > 0,
    )
    .sort((a, b) => {
      const aBase = a === data.baseCurrency;
      const bBase = b === data.baseCurrency;
      if (aBase !== bBase) return aBase ? -1 : 1;
      return a.localeCompare(b);
    });

  const typeEntries = Object.entries(stats.perType).sort(
    (a, b) => b[1].base - a[1].base,
  ) as [EntryType, { base: number; count: number }][];

  const assetTypes = typeEntries.filter(
    ([type]) => ENTRY_CATEGORY[type] === "asset",
  );
  const liabilityTypes = typeEntries.filter(
    ([type]) => ENTRY_CATEGORY[type] === "liability",
  );

  function toBaseAmount(code: string, amount: number): number | null {
    if (code === data.baseCurrency) return amount;
    const rate = data.rates[code]?.rate;
    if (!rate || rate <= 0) return null;
    return amount / rate;
  }

  function baseToCurrency(baseAmount: number, currency: string): number | null {
    if (currency === data.baseCurrency) return baseAmount;
    const rate = data.rates[currency]?.rate;
    if (!rate || rate <= 0) return null;
    return baseAmount * rate;
  }

  const assetCurrencies = currencies.filter(
    (c) => stats.perCurrency[c].asset > 0,
  );
  const liabilityCurrencies = currencies.filter(
    (c) => stats.perCurrency[c].liability > 0,
  );

  const maxAssetMagnitude = Math.max(
    ...assetCurrencies.map(
      (c) => Math.abs(toBaseAmount(c, stats.perCurrency[c].asset) ?? 0),
    ),
    1,
  );
  const maxLiabilityMagnitude = Math.max(
    ...liabilityCurrencies.map(
      (c) => Math.abs(toBaseAmount(c, stats.perCurrency[c].liability) ?? 0),
    ),
    1,
  );

  function renderCurrencyBar(
    code: string,
    amount: number,
    maxMagnitude: number,
  ) {
    const converted = toBaseAmount(code, amount);
    const hasRate = converted !== null;
    const pct =
      converted === null
        ? 0
        : Math.min(100, Math.max(0, (Math.abs(converted) / maxMagnitude) * 100));

    return (
      <div key={code} className="flex items-center gap-3">
        <div className="w-14 shrink-0 text-sm font-medium">{code}</div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="w-40 shrink-0 text-right text-sm">
          {formatMoney(amount, code)}
        </div>
        <div className="w-40 shrink-0 text-right text-xs text-zinc-400">
          {fmtBaseInDisplay(converted || 0)}
        </div>
      </div>
    );
  }

  function fmtBaseInDisplay(baseAmount: number): string {
    const v = baseToCurrency(baseAmount, displayCurrency);
    return v === null ? "no rate" : formatMoney(v, displayCurrency);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Statistics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Overview of your assets, liabilities and net worth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Display in
          </span>
          <div className="w-44">
            <CurrencySelect
              value={displayCurrency}
              onChange={setDisplayCurrency}
              enabledCurrencies={data.enabledCurrencies}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Total assets
          </div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {fmtBaseInDisplay(stats.assetsTotal)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Total liabilities
          </div>
          <div className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {fmtBaseInDisplay(stats.liabilitiesTotal)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Net worth
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {fmtBaseInDisplay(stats.netWorth)}
          </div>
          <div className="text-xs text-zinc-400">in {displayCurrency}</div>
        </div>
      </div>

      {stats.missingRates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Missing exchange rates for: {stats.missingRates.join(", ")}. These
          amounts are excluded from converted totals. Add rates in{" "}
          <span className="font-medium">Settings</span>.
        </div>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-semibold">Assets by currency</h2>
        {assetCurrencies.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No assets in enabled currencies.
          </p>
        ) : (
          <div className="space-y-2">
            {assetCurrencies.map((code) =>
              renderCurrencyBar(
                code,
                stats.perCurrency[code].asset,
                maxAssetMagnitude,
              ),
            )}
          </div>
        )}
      </section>

      {liabilityCurrencies.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-base font-semibold">
            Liabilities by currency
          </h2>
          <div className="space-y-2">
            {liabilityCurrencies.map((code) =>
              renderCurrencyBar(
                code,
                stats.perCurrency[code].liability,
                maxLiabilityMagnitude,
              ),
            )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-semibold">
          By type <span className="text-sm font-normal text-zinc-400">({displayCurrency})</span>
        </h2>
        {typeEntries.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No entries.
          </p>
        ) : (
          <div className="space-y-4">
            {assetTypes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Assets
                </div>
                {assetTypes.map(([type, val]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {ENTRY_TYPE_LABELS[type]}{" "}
                      <span className="text-zinc-400">({val.count})</span>
                    </span>
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {fmtBaseInDisplay(val.base)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {liabilityTypes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Liabilities
                </div>
                {liabilityTypes.map(([type, val]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">
                      {ENTRY_TYPE_LABELS[type]}{" "}
                      <span className="text-zinc-400">({val.count})</span>
                    </span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {fmtBaseInDisplay(val.base)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-semibold">By entry</h2>
        {stats.entries.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No entries.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Type</th>
                  <th className="py-2 pr-4 text-right font-medium">
                    Total ({displayCurrency})
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.entries.map(({ entry, base }) => {
                  const value =
                    base === null ? null : baseToCurrency(base, displayCurrency);
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                    >
                      <td className="py-2 pr-4">{entry.name}</td>
                      <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">
                        {ENTRY_TYPE_LABELS[entry.type]}
                      </td>
                      <td
                        className={`py-2 text-right font-medium ${
                          isLiability(entry.type)
                            ? "text-red-600 dark:text-red-400"
                            : ""
                        }`}
                      >
                        {value === null ? (
                          <span className="text-amber-500">missing rates</span>
                        ) : (
                          `${isLiability(entry.type) ? "−" : ""}${formatNumber(
                            value,
                          )}`
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
