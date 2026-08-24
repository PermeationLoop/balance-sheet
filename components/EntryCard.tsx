"use client";

import type { AppData, Entry } from "@/lib/types";
import { ENTRY_TYPE_LABELS, isLiability } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { toBase } from "@/lib/compute";

interface EntryCardProps {
  entry: Entry;
  data: AppData;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function EntryCard({ entry, data, onEdit, onDelete }: EntryCardProps) {
  const enabled = new Set(data.enabledCurrencies);
  const liability = isLiability(entry.type);
  let baseTotal = 0;
  let complete = true;

  for (const h of entry.holdings) {
    if (!enabled.has(h.currency)) continue;
    const converted = toBase(h.amount, h.currency, data);
    if (converted === null) complete = false;
    else baseTotal += converted;
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{entry.name}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                liability
                  ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              {ENTRY_TYPE_LABELS[entry.type]}
            </span>
          </div>
          {entry.note && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {entry.note}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={() => onEdit(entry)}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950 dark:hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1">
        {entry.holdings.map((h, i) => (
          <div
            key={i}
            className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300"
          >
            <span className={enabled.has(h.currency) ? "" : "opacity-40"}>
              {formatMoney(h.amount, h.currency)}
            </span>
            {enabled.has(h.currency) && (
              <span className="text-xs text-zinc-400">
                {h.currency === data.baseCurrency
                  ? ""
                  : `≈ ${formatMoney(
                      toBase(h.amount, h.currency, data) ?? 0,
                      data.baseCurrency,
                    )}`}
              </span>
            )}
          </div>
        ))}
      </div>

      {entry.holdings.length > 0 && (
        <div className="mt-3 border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">Total</span>{" "}
          <span
            className={`font-medium ${
              liability
                ? "text-red-600 dark:text-red-400"
                : "text-zinc-900 dark:text-zinc-100"
            }`}
          >
            {liability ? "−" : ""}
            {formatMoney(baseTotal, data.baseCurrency)}
          </span>
          {!complete && (
            <span className="ml-2 text-xs text-amber-500">(missing rates)</span>
          )}
        </div>
      )}
    </div>
  );
}
