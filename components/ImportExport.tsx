"use client";

import { useRef, useState } from "react";
import { useBalanceSheet } from "@/lib/store";
import { downloadExport, parseImport } from "@/lib/storage";

export function ImportExport() {
  const { data, importData } = useBalanceSheet();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const parsed = parseImport(String(reader.result));
      if (parsed) {
        importData(parsed);
        setStatus("Data imported successfully.");
      } else {
        setStatus("Import failed: invalid or unsupported file.");
      }
    };
    reader.onerror = () => setStatus("Import failed: could not read file.");
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => downloadExport(data)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Export data (.json)
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Import data
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Export saves everything (entries, currencies and rates) to a JSON file.
        Import replaces your current data.
      </p>
      {status && <p className="text-sm text-zinc-600 dark:text-zinc-300">{status}</p>}
    </div>
  );
}
