"use client";

import { useMemo, useState } from "react";
import { useBalanceSheet } from "@/lib/store";
import type { Entry } from "@/lib/types";
import { EntryList } from "@/components/EntryList";
import { EntryForm } from "@/components/EntryForm";
import { computeStats } from "@/lib/compute";
import { formatMoney } from "@/lib/format";

export default function Home() {
  const { data, addEntry, updateEntry, deleteEntry } = useBalanceSheet();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Entry | null>(null);

  const stats = useMemo(() => computeStats(data), [data]);

  function handleSave(entry: Entry) {
    if (editing) {
      updateEntry(entry);
    } else {
      addEntry(entry);
    }
    setFormOpen(false);
    setEditing(null);
  }

  function handleDelete(entry: Entry) {
    if (window.confirm(`Delete "${entry.name}"?`)) {
      deleteEntry(entry.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Balance Sheet</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Base currency: {data.baseCurrency}
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add entry
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Assets</div>
          <div className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {formatMoney(stats.assetsTotal, data.baseCurrency)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Liabilities
          </div>
          <div className="mt-1 text-lg font-semibold text-red-600 dark:text-red-400">
            {formatMoney(stats.liabilitiesTotal, data.baseCurrency)}
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Net worth
          </div>
          <div className="mt-1 text-lg font-semibold">
            {formatMoney(stats.netWorth, data.baseCurrency)}
          </div>
        </div>
      </div>

      <EntryList data={data} onEdit={(e) => {
        setEditing(e);
        setFormOpen(true);
      }} onDelete={handleDelete} />

      {formOpen && (
        <EntryForm
          initial={editing ?? undefined}
          enabledCurrencies={data.enabledCurrencies}
          onSave={handleSave}
          onCancel={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
