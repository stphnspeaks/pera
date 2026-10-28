"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getSettings } from "@/lib/db";
import { changeSincePreviousDay, totalsAt, type Change, type Totals } from "@/lib/networth";
import type { Account, BalanceEntry, Expense, Settings } from "@/lib/types";
import { balancesAt } from "@/lib/networth";

interface DataCtx {
  ready: boolean;
  settings: Settings;
  /** non-archived accounts */
  accounts: Account[];
  /** all accounts including archived ones (for history) */
  allAccounts: Account[];
  entries: BalanceEntry[];
  expenses: Expense[];
  balances: Map<string, number>;
  totals: Totals;
  change: Change;
}

const emptySettings: Settings = { hideBalances: false, theme: "system", onboarded: false, createdAt: 0 };

const Ctx = createContext<DataCtx>({
  ready: false,
  settings: emptySettings,
  accounts: [],
  allAccounts: [],
  entries: [],
  expenses: [],
  balances: new Map(),
  totals: { assets: 0, liabilities: 0, net: 0 },
  change: { amount: 0, percent: null, basis: "none" },
});

export const useData = () => useContext(Ctx);

export function DataProvider({ children }: { children: ReactNode }) {
  const allAccounts = useLiveQuery(() => db.accounts.toArray());
  const entries = useLiveQuery(() => db.entries.toArray());
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const settings = useLiveQuery(() => getSettings());

  const value = useMemo<DataCtx>(() => {
    const all = allAccounts ?? [];
    const ents = entries ?? [];
    const active = all.filter((a) => a.archivedAt === undefined);
    return {
      ready: !!allAccounts && !!entries && !!expenses && !!settings,
      expenses: expenses ?? [],
      settings: settings ?? emptySettings,
      accounts: active,
      allAccounts: all,
      entries: ents,
      balances: balancesAt(active, ents),
      totals: totalsAt(active, ents),
      change: changeSincePreviousDay(active, ents),
    };
  }, [allAccounts, entries, expenses, settings]);

  const theme = value.settings.theme;
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply();
    try {
      localStorage.setItem("pera-theme", theme);
    } catch {}
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
