"use client";

import { useMemo } from "react";
import { useBalanceSheet } from "@/lib/store";
import { computeStats } from "@/lib/compute";
import {
  ENTRY_CATEGORY,
  ENTRY_TYPE_LABELS,
  isLiability,
  type EntryType,
} from "@/lib/types";
import { formatMoney, formatNumber } from "@/lib/format";

export default function StatisticsPage() {
  const { data } = useBalanceSheet();

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

  const maxMagnitude = Math.max(
    ...Object.values(stats.perCurrency).flatMap((v) => [
      Math.abs(v.asset),
      Math.abs(v.liability),
    ]),
    1,
  );

  function renderCurrencyBar(code: string, amount: number) {
    const isBase = code === data.baseCurrency;
    const converted =
      code === data.baseCurrency ? amount : amount / (data.rates[code]?.rate ?? 0);
    const hasRate = isBase || (data.rates[code]?.rate ?? 0) > 0;
    const pct = Math.min(
      100,
      Math.max(0, (Math.abs(amount) / maxMagnitude) * 100),
    );

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
          {hasRate
            ? `≈ ${formatMoney(converted, data.baseCurrency)}`
            : "no rate"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Overview of your assets, liabilities and net worth.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Total assets
          </div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMoney(stats.assetsTotal, data.baseCurrency)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Total liabilities
          </div>
          <div className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {formatMoney(stats.liabilitiesTotal, data.baseCurrency)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            Net worth
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {formatMoney(stats.netWorth, data.baseCurrency)}
          </div>
          <div className="text-xs text-zinc-400">in {data.baseCurrency}</div>
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
        {currencies.filter((c) => stats.perCurrency[c].asset > 0).length ===
        0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No assets in enabled currencies.
          </p>
        ) : (
          <div className="space-y-2">
            {currencies
              .filter((c) => stats.perCurrency[c].asset > 0)
              .map((code) =>
                renderCurrencyBar(code, stats.perCurrency[code].asset),
              )}
          </div>
        )}
      </section>

      {currencies.some((c) => stats.perCurrency[c].liability > 0) && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-base font-semibold">
            Liabilities by currency
          </h2>
          <div className="space-y-2">
            {currencies
              .filter((c) => stats.perCurrency[c].liability > 0)
              .map((code) =>
                renderCurrencyBar(code, stats.perCurrency[code].liability),
              )}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-base font-semibold">By type</h2>
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
                      {formatMoney(val.base, data.baseCurrency)}
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
                      {formatMoney(val.base, data.baseCurrency)}
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
                    Total ({data.baseCurrency})
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.entries.map(({ entry, base }) => (
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
                      {base === null ? (
                        <span className="text-amber-500">missing rates</span>
                      ) : (
                        `${isLiability(entry.type) ? "−" : ""}${formatNumber(
                          base,
                        )}`
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
