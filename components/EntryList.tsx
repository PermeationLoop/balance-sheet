"use client";

import type { AppData, Entry, EntryType } from "@/lib/types";
import { ENTRY_TYPES, ENTRY_TYPE_LABELS } from "@/lib/types";
import { EntryCard } from "./EntryCard";

interface EntryListProps {
  data: AppData;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

export function EntryList({ data, onEdit, onDelete }: EntryListProps) {
  const byType = new Map<EntryType, Entry[]>();
  for (const type of ENTRY_TYPES) byType.set(type, []);

  for (const entry of data.entries) {
    byType.get(entry.type)?.push(entry);
  }

  const hasEntries = data.entries.length > 0;

  if (!hasEntries) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No entries yet. Click &quot;Add entry&quot; to get started.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {ENTRY_TYPES.filter((t) => (byType.get(t)?.length ?? 0) > 0).map(
        (type) => (
          <section key={type}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              {ENTRY_TYPE_LABELS[type]}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {byType.get(type)!.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  data={data}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}
