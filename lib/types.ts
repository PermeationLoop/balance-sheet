export type AssetType = "bank" | "investment" | "cash" | "fixed" | "insurance";
export type LiabilityType = "credit-card" | "loan" | "mortgage" | "other-debt";
export type EntryType = AssetType | LiabilityType;
export type EntryCategory = "asset" | "liability";

export const ASSET_TYPES: AssetType[] = [
  "bank",
  "investment",
  "cash",
  "fixed",
  "insurance",
];

export const LIABILITY_TYPES: LiabilityType[] = [
  "credit-card",
  "loan",
  "mortgage",
  "other-debt",
];

export const ENTRY_TYPES: EntryType[] = [...ASSET_TYPES, ...LIABILITY_TYPES];

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  bank: "Bank account",
  investment: "Investment account",
  cash: "Cash",
  fixed: "Fixed assets",
  insurance: "Insurance",
  "credit-card": "Credit card",
  loan: "Loan",
  mortgage: "Mortgage",
  "other-debt": "Other debt",
};

export const ENTRY_CATEGORY: Record<EntryType, EntryCategory> = {
  bank: "asset",
  investment: "asset",
  cash: "asset",
  fixed: "asset",
  insurance: "asset",
  "credit-card": "liability",
  loan: "liability",
  mortgage: "liability",
  "other-debt": "liability",
};

export function isLiability(type: EntryType): boolean {
  return ENTRY_CATEGORY[type] === "liability";
}

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
