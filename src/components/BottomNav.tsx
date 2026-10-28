"use client";

import { motion } from "framer-motion";
import { Clock, House, PieChart, Plus, Receipt, Settings, Wallet } from "lucide-react";
import { useUI, type Tab } from "./ui-context";

const ITEMS: { tab: Tab; label: string; Icon: typeof House }[] = [
  { tab: "home", label: "Home", Icon: House },
  { tab: "accounts", label: "Accounts", Icon: Wallet },
  { tab: "expenses", label: "Expenses", Icon: Receipt },
  { tab: "analytics", label: "Analytics", Icon: PieChart },
  { tab: "history", label: "History", Icon: Clock },
  { tab: "settings", label: "Settings", Icon: Settings },
];

export default function BottomNav() {
  const { tab, setTab, openSheet } = useUI();
  const showFab = tab === "home" || tab === "accounts" || tab === "expenses";
  const fabLabel = tab === "expenses" ? "Add expense" : "Add account";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px] px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
        {showFab && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => openSheet({ kind: tab === "expenses" ? "expense" : "add" })}
            aria-label={fabLabel}
            className="pressable pointer-events-auto absolute -top-[68px] right-6 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#1d4ed8] shadow-xl"
          >
            <Plus size={28} strokeWidth={3} />
          </motion.button>
        )}
        <nav
          aria-label="Main"
          className="glass glass-blur pointer-events-auto flex items-center justify-between rounded-[28px] p-1 shadow-2xl"
          style={{ background: "rgba(10, 28, 78, 0.62)" }}
        >
          {ITEMS.map(({ tab: t, label, Icon }) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="pressable relative flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[20px]"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[20px] bg-white/20"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                  />
                )}
                <Icon size={21} className="relative" strokeWidth={active ? 2.6 : 2} />
                <span
                  className={`relative text-[10px] leading-none ${active ? "font-extrabold" : "font-semibold opacity-80"}`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
