"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Eye,
  EyeOff,
  Minus,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react";
import { useMemo } from "react";
import config from "@config";
import { saveSettings } from "@/lib/db";
import { categoryLabel, monthTotal } from "@/lib/expenses";
import { backupDue } from "../backup";
import CategoryIcon from "../CategoryIcon";
import { useData } from "../DataProvider";
import Logo from "../Logo";
import Money from "../Money";
import { Avatar, MintButton, Rise } from "../ui";
import { useUI } from "../ui-context";

export default function Home() {
  const { settings, accounts, expenses, balances, totals, change } = useData();
  const { setTab, openSheet } = useUI();

  const top = useMemo(
    () =>
      [...accounts]
        .sort((a, b) => (balances.get(b.id) ?? 0) - (balances.get(a.id) ?? 0))
        .slice(0, 5),
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
  const trendColor = flat ? "text-muted" : up ? "text-up" : "text-down";
  const basisLabel =
    change.basis === "yesterday" ? "vs yesterday" : change.basis === "last-update" ? "since last update" : "";

  return (
    <div className="flex flex-col gap-4">
      <Rise>
        <header className="flex items-center gap-2.5 pb-1 pt-1">
          <Logo size={34} background />
          <span className="text-[22px] font-extrabold tracking-tight">{config.name}</span>
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
              <SettingsIcon size={22} />
            </button>
          </div>
        </header>
      </Rise>

      <Rise i={1}>
        <section className="rounded-[28px] border border-line bg-card p-5" aria-label="Net worth">
          <p className="text-[15px] font-semibold text-muted">Net worth</p>
          <p className="mt-1 text-[44px] font-extrabold leading-none tracking-tight">
            <Money centavos={totals.net} count decimalClassName="text-muted" />
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm font-bold">
            <span className={`inline-flex items-center gap-1 ${trendColor}`}>
              <Trend size={16} strokeWidth={3} />
              {change.percent === null ? (flat ? "0.00%" : "New") : `${Math.abs(change.percent).toFixed(2)}%`}
            </span>
            {basisLabel && (
              <span className="text-muted">
                <Money centavos={change.amount} signed decimalClassName="opacity-70" /> {basisLabel}
              </span>
            )}
          </p>

          <div className="mt-5 flex gap-3">
            <MintButton onClick={() => openSheet({ kind: "expense" })}>
              <ArrowUpRight size={20} strokeWidth={2.6} /> Add expense
            </MintButton>
            <MintButton onClick={() => openSheet({ kind: "pick" })} aria-label="Update balance">
              <RefreshCw size={18} strokeWidth={2.6} /> Update
            </MintButton>
          </div>

          {backupDue(settings) && (
            <button
              onClick={() => openSheet({ kind: "export" })}
              className="pressable mt-4 flex w-full items-center gap-3 rounded-2xl bg-peach p-4 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[15px] font-extrabold text-peach-fg">
                  Time for a backup <ChevronRight size={16} strokeWidth={3} />
                </span>
                <span className="mt-0.5 block text-sm text-peach-fg opacity-80">
                  Your data only lives on this phone. Export a copy so you never lose it.
                </span>
              </span>
            </button>
          )}
        </section>
      </Rise>

      <Rise i={2}>
        <section
          className="flex items-center gap-3 rounded-[28px] border border-line bg-card px-5 py-4"
          aria-label="Spending this month"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-muted">Spent this month</p>
            <p className="text-2xl font-extrabold leading-tight">
              <Money centavos={spent} decimalClassName="text-muted" />
            </p>
          </div>
          <button
            onClick={() => setTab("expenses")}
            className="pressable min-h-[44px] rounded-xl bg-brand px-5 text-[15px] font-extrabold text-white"
          >
            See all
          </button>
        </section>
      </Rise>

      <Rise i={3}>
        <section className="rounded-[28px] border border-line bg-card px-5 pb-2 pt-4" aria-label="Accounts">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Accounts</h2>
            <div className="flex items-center">
              <button
                onClick={() => openSheet({ kind: "add" })}
                aria-label="Add account"
                className="pressable flex min-h-[44px] items-center gap-1 px-2 text-sm font-extrabold text-accent"
              >
                <Plus size={16} strokeWidth={3} /> Add
              </button>
              <button
                onClick={() => setTab("accounts")}
                className="pressable flex min-h-[44px] items-center px-2 text-sm font-extrabold text-accent"
              >
                See all
              </button>
            </div>
          </div>
          {top.length === 0 ? (
            <p className="pb-4 text-sm text-muted">No accounts yet. Tap “Add” to start tracking your money.</p>
          ) : (
            <ul className="divide-y divide-line">
              {top.map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => openSheet({ kind: "balance", accountId: a.id })}
                    className="pressable flex min-h-[64px] w-full items-center gap-3 py-2 text-left"
                  >
                    <Avatar account={a} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{a.name}</span>
                      <span className="block text-xs text-muted">{a.type}</span>
                    </span>
                    <Money centavos={balances.get(a.id) ?? 0} className="font-extrabold" decimalClassName="text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Rise>

      {recent.length > 0 && (
        <Rise i={4}>
          <section className="rounded-[28px] border border-line bg-card px-5 pb-2 pt-4" aria-label="Recent expenses">
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-extrabold">Recent expenses</h2>
              <button
                onClick={() => setTab("expenses")}
                className="pressable flex min-h-[44px] items-center px-2 text-sm font-extrabold text-accent"
              >
                See all
              </button>
            </div>
            <ul className="divide-y divide-line">
              {recent.map((e) => (
                <li key={e.id} className="flex min-h-[60px] items-center gap-3 py-2">
                  <CategoryIcon id={e.category} size={40} />
                  <span className="min-w-0 flex-1 truncate font-bold">{e.note || categoryLabel(e.category)}</span>
                  <Money centavos={-e.amountCentavos} className="font-extrabold" decimalClassName="text-muted" />
                </li>
              ))}
            </ul>
          </section>
        </Rise>
      )}
    </div>
  );
}
