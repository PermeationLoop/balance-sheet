export const FX_BASE_URL = "https://api.frankfurter.dev/v2";

interface FxRow {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

/**
 * Fetch latest rates from the Frankfurter v2 API.
 * Returns a map of `quote` currency -> rate, where `rate` is the number of
 * `quote` units per 1 `base` unit (e.g. base=USD, quote=EUR -> 0.855 means
 * 1 USD = 0.855 EUR).
 */
export async function fetchLatestRates(
  base: string,
  quotes: string[],
): Promise<Record<string, number>> {
  const unique = [...new Set(quotes.filter((q) => q && q !== base))];
  if (unique.length === 0) return {};

  const url = `${FX_BASE_URL}/rates?base=${encodeURIComponent(
    base,
  )}&quotes=${encodeURIComponent(unique.join(","))}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Rate request failed (${res.status})`);
  }

  const rows = (await res.json()) as FxRow[];
  const out: Record<string, number> = {};
  for (const row of rows) {
    if (row && row.quote && typeof row.rate === "number") {
      out[row.quote] = row.rate;
    }
  }
  return out;
}
