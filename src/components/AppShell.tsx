"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import AddAccountSheet from "./AddAccountSheet";
import AddExpenseSheet from "./AddExpenseSheet";
import Expenses from "./screens/Expenses";
import BalanceSheet from "./BalanceSheet";
import BottomNav from "./BottomNav";
import { DataProvider, useData } from "./DataProvider";
import ExportSheet from "./ExportSheet";
import Lock from "./Lock";
import Onboarding from "./Onboarding";
import PickSheet from "./PickSheet";
import Splash from "./Splash";
import Accounts from "./screens/Accounts";
import Analytics from "./screens/Analytics";
import History from "./screens/History";
import Home from "./screens/Home";
import Settings from "./screens/Settings";
import { UIProvider, useUI, type Tab } from "./ui-context";

const SCREENS: Record<Tab, () => React.JSX.Element> = {
  home: Home,
  accounts: Accounts,
  expenses: Expenses,
  analytics: Analytics,
  history: History,
  settings: Settings,
};

const RELOCK_AFTER_MS = 60_000;

export default function AppShell() {
  return (
    <MotionConfig reducedMotion="user">
      <DataProvider>
        <UIProvider>
          <Shell />
        </UIProvider>
      </DataProvider>
    </MotionConfig>
  );
}

function Shell() {
  const { ready, settings } = useData();
  const [splash, setSplash] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const booted = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setSplash(false), reduce ? 0 : 2300);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (navigator.storage?.persist) void navigator.storage.persist();
  }, []);

  // Launch with a PIN stays locked; setting/changing a PIN while using the app does not lock you out.
  useEffect(() => {
    if (!ready) return;
    if (!settings.pinHash || booted.current) setUnlocked(true);
    booted.current = true;
  }, [ready, settings.pinHash]);

  const hasPin = !!settings.pinHash;
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hasPin && hiddenAt && Date.now() - hiddenAt > RELOCK_AFTER_MS) setUnlocked(false);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [hasPin]);

  const onUnlock = useCallback(() => setUnlocked(true), []);
  const locked = hasPin && !unlocked;

  return (
    <>
      <AnimatePresence>{splash && <Splash key="splash" />}</AnimatePresence>
      {ready && locked && <Lock pinHash={settings.pinHash!} onUnlock={onUnlock} />}
      {ready && !locked && (settings.onboarded ? <Main /> : <Onboarding />)}
    </>
  );
}

function Main() {
  const { tab, sheet, closeSheet, toast } = useUI();
  const Screen = SCREENS[tab];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  return (
    <>
      <main className="safe-top mx-auto w-full max-w-[480px] px-4 pb-[150px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.16 }}
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav />

      <AddAccountSheet open={sheet?.kind === "add"} />
      <AddExpenseSheet open={sheet?.kind === "expense"} />
      <PickSheet open={sheet?.kind === "pick"} />
      <BalanceSheet accountId={sheet?.kind === "balance" ? sheet.accountId : null} />
      <ExportSheet open={sheet?.kind === "export"} />

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            role="status"
            className="pointer-events-none fixed inset-x-0 bottom-[110px] z-[60] flex justify-center px-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
          >
            <span className="rounded-full bg-fg px-5 py-3 text-sm font-bold text-page shadow-xl">
              {toast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
