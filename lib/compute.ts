import type { AppData, Entry } from "./types";
import { isLiability } from "./types";

/**
 * Convert an amount in `currency` into the base currency.
 * Returns null when the rate is unknown.
 */
export function toBase(
  amount: number,
  currency: string,
  data: AppData,
): number | null {
  if (currency === data.baseCurrency) return amount;
  const info = data.rates[currency];
  if (!info || !info.rate || info.rate <= 0) return null;
  return amount / info.rate;
}

export interface CurrencyBreakdown {
  asset: number;
  liability: number;
}

export interface ComputedStats {
  perCurrency: Record<string, CurrencyBreakdown>;
  perType: Record<string, { base: number; count: number }>;
  entries: { entry: Entry; base: number | null }[];
  assetsTotal: number;
  liabilitiesTotal: number;
  netWorth: number;
  missingRates: string[];
}

export function computeStats(data: AppData): ComputedStats {
  const enabled = new Set(data.enabledCurrencies);
  const perCurrency: Record<string, CurrencyBreakdown> = {};
  const perType: Record<string, { base: number; count: number }> = {};
  const entries: { entry: Entry; base: number | null }[] = [];
  const missingRates = new Set<string>();

  let assetsTotal = 0;
  let liabilitiesTotal = 0;

  for (const entry of data.entries) {
    const liability = isLiability(entry.type);
    let entryBase = 0;
    let entryComplete = true;

    for (const holding of entry.holdings) {
      if (!enabled.has(holding.currency)) continue;

      const breakdown = (perCurrency[holding.currency] ??= {
        asset: 0,
        liability: 0,
      });
      if (liability) breakdown.liability += holding.amount;
      else breakdown.asset += holding.amount;

      const converted = toBase(holding.amount, holding.currency, data);
      if (converted === null) {
        entryComplete = false;
        missingRates.add(holding.currency);
      } else {
        entryBase += converted;
      }
    }

    perType[entry.type] = perType[entry.type] ?? { base: 0, count: 0 };
    perType[entry.type].base += entryBase;
    perType[entry.type].count += 1;

    if (liability) liabilitiesTotal += entryBase;
    else assetsTotal += entryBase;

    entries.push({ entry, base: entryComplete ? entryBase : null });
  }

  entries.sort((a, b) => (b.base ?? 0) - (a.base ?? 0));

  return {
    perCurrency,
    perType,
    entries,
    assetsTotal,
    liabilitiesTotal,
    netWorth: assetsTotal - liabilitiesTotal,
    missingRates: [...missingRates].sort(),
  };
}
