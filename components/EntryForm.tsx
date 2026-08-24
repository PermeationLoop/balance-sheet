"use client";

import { useState } from "react";
import type { Entry, EntryType, Holding } from "@/lib/types";
import { ASSET_TYPES, LIABILITY_TYPES, ENTRY_TYPE_LABELS } from "@/lib/types";
import { uid } from "@/lib/format";
import { CurrencySelect } from "./CurrencySelect";

interface EntryFormProps {
  initial?: Entry;
  enabledCurrencies: string[];
  onSave: (entry: Entry) => void;
  onCancel: () => void;
}

interface DraftHolding {
  key: string;
  currency: string;
  amount: string;
}

function toDraft(entry?: Entry) {
  return {
    name: entry?.name ?? "",
    type: (entry?.type ?? "bank") as EntryType,
    note: entry?.note ?? "",
    holdings: (
      entry?.holdings?.map((h) => ({
        key: uid(),
        currency: h.currency,
        amount: h.amount === 0 ? "" : String(h.amount),
      })) ?? [{ key: uid(), currency: "", amount: "" }]
    ) as DraftHolding[],
  };
}

export function EntryForm({
  initial,
  enabledCurrencies,
  onSave,
  onCancel,
}: EntryFormProps) {
  const [draft, setDraft] = useState(() => toDraft(initial));

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function updateHolding(key: string, patch: Partial<DraftHolding>) {
    setDraft((d) => ({
      ...d,
      holdings: d.holdings.map((h) => (h.key === key ? { ...h, ...patch } : h)),
    }));
  }

  function addHolding() {
    setDraft((d) => ({
      ...d,
      holdings: [...d.holdings, { key: uid(), currency: "", amount: "" }],
    }));
  }

  function removeHolding(key: string) {
    setDraft((d) => ({
      ...d,
      holdings: d.holdings.filter((h) => h.key !== key),
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) return;

    const holdings: Holding[] = draft.holdings
      .filter((h) => h.currency)
      .map((h) => ({
        currency: h.currency,
        amount: parseFloat(h.amount) || 0,
      }));

    const now = Date.now();
    onSave({
      id: initial?.id ?? uid(),
      type: draft.type,
      name,
      note: draft.note.trim() || undefined,
      holdings,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="mt-8 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900"
      >
        <h2 className="mb-4 text-lg font-semibold">
          {initial ? "Edit entry" : "New entry"}
        </h2>

        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Name
        </label>
        <input
          autoFocus
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. Main checking account"
          className="mb-4 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />

        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Type
        </label>
        <select
          value={draft.type}
          onChange={(e) => set("type", e.target.value as EntryType)}
          className="mb-4 w-full rounded-md border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          <optgroup label="Assets">
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {ENTRY_TYPE_LABELS[t]}
              </option>
            ))}
          </optgroup>
          <optgroup label="Liabilities">
            {LIABILITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {ENTRY_TYPE_LABELS[t]}
              </option>
            ))}
          </optgroup>
        </select>

        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Holdings
        </label>
        <div className="mb-1 space-y-2">
          {draft.holdings.map((h) => (
            <div key={h.key} className="flex items-center gap-2">
              <div className="flex-1">
                <CurrencySelect
                  value={h.currency}
                  onChange={(v) => updateHolding(h.key, { currency: v })}
                  enabledCurrencies={enabledCurrencies}
                />
              </div>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={h.amount}
                onChange={(e) => updateHolding(h.key, { amount: e.target.value })}
                placeholder="0.00"
                className="w-36 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <button
                type="button"
                onClick={() => removeHolding(h.key)}
                disabled={draft.holdings.length === 1}
                className="rounded-md px-2 py-1.5 text-sm text-zinc-400 hover:text-red-500 disabled:opacity-30"
                aria-label="Remove holding"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addHolding}
          className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          + Add currency
        </button>

        <label className="mb-1 block text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Note (optional)
        </label>
        <input
          value={draft.note}
          onChange={(e) => set("note", e.target.value)}
          placeholder="Optional note"
          className="mb-6 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!draft.name.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
