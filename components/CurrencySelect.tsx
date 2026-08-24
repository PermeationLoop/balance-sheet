"use client";

import { CURRENCIES } from "@/lib/currencies";

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  enabledCurrencies?: string[];
  placeholder?: string;
}

export function CurrencySelect({
  value,
  onChange,
  disabled = false,
  enabledCurrencies,
  placeholder = "Select currency",
}: CurrencySelectProps) {
  const enabledSet = enabledCurrencies ? new Set(enabledCurrencies) : null;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <option value="">{placeholder}</option>
      {CURRENCIES.map((c) => {
        const isEnabled = !enabledSet || enabledSet.has(c.code);
        return (
          <option key={c.code} value={c.code}>
            {c.code} — {c.name}
            {!isEnabled ? " (disabled)" : ""}
          </option>
        );
      })}
    </select>
  );
}
