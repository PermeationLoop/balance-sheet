export type EntryType = "bank" | "investment" | "cash" | "fixed" | "insurance";

export const ENTRY_TYPES: EntryType[] = [
  "bank",
  "investment",
  "cash",
  "fixed",
  "insurance",
];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  bank: "Bank account",
  investment: "Investment account",
  cash: "Cash",
  fixed: "Fixed assets",
  insurance: "Insurance",
};

export interface Holding {
  currency: string;
  amount: number;
}

export interface Entry {
  id: string;
  type: EntryType;
  name: string;
  note?: string;
  holdings: Holding[];
  createdAt: number;
  updatedAt: number;
}

export type RateSource = "manual" | "api";

export interface RateInfo {
  rate: number;
  source: RateSource;
  updatedAt: number;
}

export interface AppData {
  version: 1;
  baseCurrency: string;
  enabledCurrencies: string[];
  rates: Record<string, RateInfo>;
  entries: Entry[];
}
