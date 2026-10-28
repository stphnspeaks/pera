"use client";

import { ArrowDownRight, ArrowUpRight, Download, Eye, EyeOff, Menu, Minus, Plus, Receipt, RefreshCw } from "lucide-react";
import config from "@config";
import { saveSettings } from "@/lib/db";
import { categoryLabel, monthTotal } from "@/lib/expenses";
import { useMemo, useState } from "react";
import CategoryIcon from "../CategoryIcon";
import { useData } from "../DataProvider";
import Logo from "../Logo";
import Money from "../Money";
import { Avatar, Chip, Rise } from "../ui";
import { useUI } from "../ui-context";
import { backupDue } from "../backup";

export default function Home() {
  const { settings, accounts, expenses, balances, totals, change } = useData();
  const { setTab, openSheet } = useUI();
  const [dismissed, setDismissed] = useState(false);

  const top = useMemo(
    () =>
      accounts
        .filter((a) => !a.isLiability)
        .sort((a, b) => (balances.get(b.id) ?? 0) - (balances.get(a.id) ?? 0))
        .slice(0, 3),
    [accounts, balances],
  );
  const spent = useMemo(() => monthTotal(expenses), [expenses]);
  const recent = useMemo(
    () => [...expenses].sort((a, b) => b.recordedAt - a.recordedAt).slice(0, 3),
    [expenses],
  );

  const up = change.amount > 0;
  const flat = change.amount === 0;
  const Trend = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const trendColor = flat ? "text-white" : up ? "text-up" : "text-down";
  const basisLabel =
    change.basis === "yesterday" ? "vs yesterday" : change.basis === "last-update" ? "since last update" : "no changes yet";

  return (
    <div className="flex flex-col gap-4">
      <Rise>
        <header className="flex items-center gap-3 pb-1">
          <Logo size={38} background />
          <span className="text-xl font-extrabold tracking-tight">{config.name}</span>
          <div className="ml-auto flex items-center">
            <button
              onClick={() => saveSettings({ hideBalances: !settings.hideBalances })}
              aria-label={settings.hideBalances ? "Show balances" : "Hide balances"}
              aria-pressed={settings.hideBalances}
              className="pressable flex h-11 w-11 items-center justify-center rounded-full"
            >
              {settings.hideBalances ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
            <button
              onClick={() => setTab("settings")}
              aria-label="Open settings"
              className="pressable flex h-11 w-11 items-center justify-center rounded-full"
            >
              <Menu size={22} />
            </button>
          </div>
        </header>
      </Rise>

      {!dismissed && backupDue(settings) && (
        <Rise i={1}>
          <div className="flex items-center gap-3 rounded-3xl bg-amber-300 p-4 text-[#2b1d00]">
            <div className="flex-1 text-sm">
              <p className="font-extrabold">Time for a backup</p>
              <p>Your data only lives on this phone. Export a copy so you never lose it.</p>
            </div>
            <button
              onClick={() => openSheet({ kind: "export" })}
              className="pressable min-h-[44px] rounded-full bg-[#2b1d00] px-4 text-sm font-bold text-white"
            >
              Export
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss reminder"
              className="pressable min-h-[44px] px-1 text-sm font-bold"
            >
              Later
            </button>
          </div>
        </Rise>
      )}

      <Rise i={1}>
        <section className="glass glass-blur relative overflow-hidden rounded-[36px] p-6 shadow-2xl" aria-label="Net worth">
          <span aria-hidden className="pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-white/15" />
          <span aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-white/10" />
          <p className="relative text-sm font-semibold text-muted">Total net worth</p>
          <p className="relative mt-1 text-[44px] font-extrabold leading-tight tracking-tight">
            <Money centavos={totals.net} count />
          </p>
          <div className="relative mt-3 flex flex-wrap gap-2">
            <Chip className={trendColor}>
              <Trend size={14} strokeWidth={3} />
              {change.percent === null ? (flat ? "0.00%" : "New") : `${Math.abs(change.percent).toFixed(2)}%`}
            </Chip>
            <Chip>
              <Money centavos={change.amount} signed alwaysShow={false} decimalClassName="opacity-70" />{" "}
              <span className="font-semibold opacity-80">{basisLabel}</span>
            </Chip>
          </div>
          <div className="relative mt-5 grid grid-cols-4 gap-2">
            <Quick Icon={Receipt} label="Add Expense" primary onClick={() => openSheet({ kind: "expense" })} />
            <Quick Icon={Plus} label="Add Account" onClick={() => openSheet({ kind: "add" })} />
            <Quick Icon={RefreshCw} label="Update Balance" onClick={() => openSheet({ kind: "pick" })} />
            <Quick Icon={Download} label="Export" onClick={() => openSheet({ kind: "export" })} />
          </div>
        </section>
      </Rise>

      <Rise i={2}>
        <section className="rounded-[28px] bg-card p-5" aria-label="Spending">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold">Spent this month</h2>
              <Money centavos={spent} className="text-2xl font-extrabold" />
            </div>
            <button
              onClick={() => setTab("expenses")}
              className="pressable flex min-h-[44px] items-center px-2 text-sm font-bold text-accent"
            >
              See All
            </button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">
              Log what you spend and it comes off the account you paid with, so your net worth stays accurate.
            </p>
          ) : (
            <ul>
              {recent.map((e) => (
                <li key={e.id} className="flex min-h-[56px] items-center gap-3 py-1">
                  <CategoryIcon id={e.category} size={40} />
                  <span className="min-w-0 flex-1 truncate font-bold">{e.note || categoryLabel(e.category)}</span>
                  <Money centavos={-e.amountCentavos} className="font-extrabold" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </Rise>

      <Rise i={3}>
        <section className="rounded-[28px] bg-card p-5" aria-label="Top accounts">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Top Accounts</h2>
            <button
              onClick={() => setTab("accounts")}
              className="pressable flex min-h-[44px] items-center px-2 text-sm font-bold text-accent"
            >
              See All
            </button>
          </div>
          {top.length === 0 ? (
            <p className="py-4 text-sm text-muted">
              No accounts yet. Tap “Add Account” to start tracking your money.
            </p>
          ) : (
            <ul className="flex flex-col">
              {top.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => openSheet({ kind: "balance", accountId: a.id })}
                    className="pressable my-1 flex min-h-[64px] w-full items-center gap-3 rounded-3xl px-2 py-1 text-left"
                    style={{ background: `linear-gradient(90deg, ${a.color}40, ${a.color}00 75%)` }}
                  >
                    <Avatar account={a} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{a.name}</span>
                      <span className="block text-xs text-muted">{a.type}</span>
                    </span>
                    <Money centavos={balances.get(a.id) ?? 0} className="font-extrabold" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Rise>

    </div>
  );
}

function Quick({
  Icon,
  label,
  onClick,
  primary,
}: {
  Icon: typeof Plus;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`pressable flex min-h-[78px] flex-col items-center justify-center gap-1.5 rounded-3xl px-1 text-center ${
        primary ? "bg-white text-[#1d4ed8] shadow-lg" : "bg-white/20"
      }`}
    >
      <Icon size={22} />
      <span className="text-[11px] font-bold leading-tight">{label}</span>
    </button>
  );
}
