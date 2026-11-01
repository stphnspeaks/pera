"use client";

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
  const showFab = tab === "accounts" || tab === "expenses";
  const fabLabel = tab === "expenses" ? "Add expense" : "Add account";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="relative w-full max-w-[480px] px-5 pb-[max(env(safe-area-inset-bottom),14px)]">
        {showFab && (
          <button
            onClick={() => openSheet({ kind: tab === "expenses" ? "expense" : "add" })}
            aria-label={fabLabel}
            className="pressable pointer-events-auto absolute -top-[66px] right-7 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.45)]"
          >
            <Plus size={28} strokeWidth={3} />
          </button>
        )}
        <nav
          aria-label="Main"
          className="pointer-events-auto flex items-center justify-between rounded-[30px] bg-nav p-2 shadow-[0_14px_30px_-10px_rgba(0,0,0,0.5)]"
        >
          {ITEMS.map(({ tab: t, label, Icon }) => {
            const active = t === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`pressable flex h-12 min-w-0 flex-1 items-center justify-center rounded-[20px] ${
                  active ? "bg-brand text-white" : "text-white/75"
                }`}
              >
                <Icon size={23} strokeWidth={active ? 2.4 : 2} />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
