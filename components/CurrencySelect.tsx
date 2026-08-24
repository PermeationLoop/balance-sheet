"use client";

import { CURRENCIES } from "@/lib/currencies";

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  enabledCurrencies?: string[];
  baseCurrency?: string;
  placeholder?: string;
}

export function CurrencySelect({
  value,
  onChange,
  disabled = false,
  enabledCurrencies,
  baseCurrency,
  placeholder = "Select currency",
}: CurrencySelectProps) {
  const enabledSet = enabledCurrencies ? new Set(enabledCurrencies) : null;
  const options = enabledSet
    ? CURRENCIES.filter((c) => enabledSet.has(c.code))
    : CURRENCIES;
  const selected = value || baseCurrency || "";

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      {!selected && <option value="">{placeholder}</option>}
      {options.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
