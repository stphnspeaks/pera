"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Tab = "home" | "accounts" | "expenses" | "analytics" | "history" | "settings";

export type SheetState =
  | null
  | { kind: "add" }
  | { kind: "balance"; accountId: string }
  | { kind: "pick" }
  | { kind: "expense" }
  | { kind: "export" };

interface UICtx {
  tab: Tab;
  setTab: (t: Tab) => void;
  sheet: SheetState;
  openSheet: (s: Exclude<SheetState, null>) => void;
  closeSheet: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
  historyFilter: string | null;
  setHistoryFilter: (id: string | null) => void;
}

const Ctx = createContext<UICtx | null>(null);

export const useUI = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI outside provider");
  return v;
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }, []);

  const value = useMemo<UICtx>(
    () => ({
      tab,
      setTab,
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      toast,
      showToast,
      historyFilter,
      setHistoryFilter,
    }),
    [tab, sheet, toast, showToast, historyFilter],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
