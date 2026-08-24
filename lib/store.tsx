"use client";

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AppData, Entry, RateInfo, RateSource } from "./types";
import { getServerSnapshot, getSnapshot, setData, subscribe } from "./storage";

type Action =
  | { type: "ADD_ENTRY"; entry: Entry }
  | { type: "UPDATE_ENTRY"; entry: Entry }
  | { type: "DELETE_ENTRY"; id: string }
  | { type: "SET_BASE_CURRENCY"; currency: string }
  | { type: "TOGGLE_CURRENCY"; currency: string }
  | { type: "SET_RATE"; currency: string; rate: number; source: RateSource }
  | { type: "SET_RATES"; rates: Record<string, RateInfo> }
  | { type: "IMPORT"; data: AppData };

function apply(state: AppData, action: Action): AppData {
  switch (action.type) {
    case "IMPORT":
      return action.data;
    case "ADD_ENTRY":
      return { ...state, entries: [...state.entries, action.entry] };
    case "UPDATE_ENTRY":
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.entry.id ? action.entry : e,
        ),
      };
    case "DELETE_ENTRY":
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.id),
      };
    case "SET_BASE_CURRENCY": {
      if (action.currency === state.baseCurrency) return state;
      const enabled = state.enabledCurrencies.includes(action.currency)
        ? state.enabledCurrencies
        : [...state.enabledCurrencies, action.currency];
      return { ...state, baseCurrency: action.currency, enabledCurrencies: enabled };
    }
    case "TOGGLE_CURRENCY": {
      if (action.currency === state.baseCurrency) return state;
      const enabled = state.enabledCurrencies.includes(action.currency)
        ? state.enabledCurrencies.filter((c) => c !== action.currency)
        : [...state.enabledCurrencies, action.currency];
      return { ...state, enabledCurrencies: enabled };
    }
    case "SET_RATE":
      return {
        ...state,
        rates: {
          ...state.rates,
          [action.currency]: {
            rate: action.rate,
            source: action.source,
            updatedAt: Date.now(),
          },
        },
      };
    case "SET_RATES":
      return { ...state, rates: { ...state.rates, ...action.rates } };
    default:
      return state;
  }
}

interface StoreValue {
  data: AppData;
  addEntry: (entry: Entry) => void;
  updateEntry: (entry: Entry) => void;
  deleteEntry: (id: string) => void;
  setBaseCurrency: (currency: string) => void;
  toggleCurrency: (currency: string) => void;
  setRate: (currency: string, rate: number, source: RateSource) => void;
  setRates: (rates: Record<string, RateInfo>) => void;
  importData: (data: AppData) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dispatch = (action: Action) => {
    setData(apply(getSnapshot(), action));
  };

  const value: StoreValue = {
    data,
    addEntry: (entry) => dispatch({ type: "ADD_ENTRY", entry }),
    updateEntry: (entry) => dispatch({ type: "UPDATE_ENTRY", entry }),
    deleteEntry: (id) => dispatch({ type: "DELETE_ENTRY", id }),
    setBaseCurrency: (currency) => dispatch({ type: "SET_BASE_CURRENCY", currency }),
    toggleCurrency: (currency) => dispatch({ type: "TOGGLE_CURRENCY", currency }),
    setRate: (currency, rate, source) =>
      dispatch({ type: "SET_RATE", currency, rate, source }),
    setRates: (rates) => dispatch({ type: "SET_RATES", rates }),
    importData: (data) => dispatch({ type: "IMPORT", data }),
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useBalanceSheet(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useBalanceSheet must be used within a StoreProvider");
  }
  return ctx;
}
