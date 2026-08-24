import type { AppData, Entry } from "./types";

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

export interface ComputedStats {
  perCurrency: Record<string, number>;
  perType: Record<string, { base: number; count: number }>;
  entries: { entry: Entry; base: number | null }[];
  grandTotal: number;
  missingRates: string[];
}

export function computeStats(data: AppData): ComputedStats {
  const enabled = new Set(data.enabledCurrencies);
  const perCurrency: Record<string, number> = {};
  const perType: Record<string, { base: number; count: number }> = {};
  const entries: { entry: Entry; base: number | null }[] = [];
  const missingRates = new Set<string>();

  let grandTotal = 0;

  for (const entry of data.entries) {
    let entryBase = 0;
    let entryComplete = true;

    for (const holding of entry.holdings) {
      if (!enabled.has(holding.currency)) continue;

      perCurrency[holding.currency] =
        (perCurrency[holding.currency] ?? 0) + holding.amount;

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

    grandTotal += entryBase;
    entries.push({ entry, base: entryComplete ? entryBase : null });
  }

  entries.sort((a, b) => (b.base ?? 0) - (a.base ?? 0));

  return {
    perCurrency,
    perType,
    entries,
    grandTotal,
    missingRates: [...missingRates].sort(),
  };
}
