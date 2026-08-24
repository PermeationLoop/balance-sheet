"use client";

import type { AppData, Entry, EntryType } from "@/lib/types";
import { ENTRY_CATEGORY, ENTRY_TYPES, ENTRY_TYPE_LABELS } from "@/lib/types";
import { EntryCard } from "./EntryCard";

interface EntryListProps {
  data: AppData;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}

function TypeSection({
  type,
  entries,
  data,
  onEdit,
  onDelete,
}: {
  type: EntryType;
  entries: Entry[];
  data: AppData;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {ENTRY_TYPE_LABELS[type]}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
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
  );
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

  const assetTypes = ENTRY_TYPES.filter(
    (t) => ENTRY_CATEGORY[t] === "asset" && (byType.get(t)?.length ?? 0) > 0,
  );
  const liabilityTypes = ENTRY_TYPES.filter(
    (t) =>
      ENTRY_CATEGORY[t] === "liability" && (byType.get(t)?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-8">
      {assetTypes.length > 0 && (
        <div className="space-y-6">
          {assetTypes.map((type) => (
            <TypeSection
              key={type}
              type={type}
              entries={byType.get(type)!}
              data={data}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {liabilityTypes.length > 0 && (
        <div className="space-y-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <h2 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
            Liabilities
          </h2>
          {liabilityTypes.map((type) => (
            <TypeSection
              key={type}
              type={type}
              entries={byType.get(type)!}
              data={data}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
