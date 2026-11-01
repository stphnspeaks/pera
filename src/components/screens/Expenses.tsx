"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { deleteExpense } from "@/lib/db";
import { categoryLabel, categoryTotals, groupByDay, monthTotal } from "@/lib/expenses";
import type { Expense } from "@/lib/types";
import CategoryIcon from "../CategoryIcon";
import { useData } from "../DataProvider";
import Money from "../Money";
import Sheet from "../Sheet";
import { Avatar, Chip, Empty, Rise, ScreenTitle, SecondaryButton } from "../ui";
import { useUI } from "../ui-context";

const monthName = new Intl.DateTimeFormat("en-PH", { month: "long" });
const timeFmt = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" });

export default function Expenses() {
  const { expenses, allAccounts } = useData();
  const { openSheet, showToast } = useUI();
  const [target, setTarget] = useState<Expense | null>(null);
  const [busy, setBusy] = useState(false);

  const now = Date.now();
  const month = useMemo(() => monthTotal(expenses, now), [expenses]); // eslint-disable-line react-hooks/exhaustive-deps
  const today = useMemo(() => {
    const g = groupByDay(expenses, now)[0];
    return g?.label === "Today" ? g.total : 0;
  }, [expenses]); // eslint-disable-line react-hooks/exhaustive-deps
  const cats = useMemo(() => categoryTotals(expenses, now), [expenses]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = useMemo(() => groupByDay(expenses, now).slice(0, 60), [expenses]); // eslint-disable-line react-hooks/exhaustive-deps
  const accountOf = (id: string) => allAccounts.find((a) => a.id === id);
  const targetAccount = target ? accountOf(target.accountId) : undefined;

  async function remove() {
    if (!target) return;
    setBusy(true);
    try {
      await deleteExpense(target.id);
      showToast("Expense removed, money put back");
      setTarget(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenTitle>Expenses</ScreenTitle>

      <Rise>
        <section className="rounded-[28px] border border-line bg-card p-5" aria-label="Spending summary">
          <p className="text-sm font-semibold text-muted">Spent in {monthName.format(now)}</p>
          <p className="mt-1 text-[36px] font-extrabold leading-tight tracking-tight">
            <Money centavos={month} count decimalClassName="text-muted" />
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip>
              Today <Money centavos={today} className="font-extrabold" decimalClassName="opacity-70" />
            </Chip>
          </div>
          <button
            onClick={() => openSheet({ kind: "expense" })}
            className="pressable mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand text-base font-extrabold text-white"
          >
            <Plus size={20} strokeWidth={3} /> Add expense
          </button>
        </section>
      </Rise>

      {expenses.length === 0 ? (
        <Rise i={1}>
          <Empty
            title="No expenses yet"
            body="Log what you spend. It comes off the account you paid with and your net worth updates right away."
          />
        </Rise>
      ) : (
        <>
          {cats.length > 0 && (
            <Rise i={1}>
              <section className="rounded-[28px] bg-card p-5" aria-label="Spending by category">
                <h2 className="mb-3 text-lg font-extrabold">By category</h2>
                <ul className="flex flex-col gap-3">
                  {cats.slice(0, 5).map(({ category, total }) => (
                    <li key={category.id}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-bold">{category.label}</span>
                        <Money centavos={total} className="font-bold" decimalClassName="opacity-60" />
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-soft">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.max(4, (total / month) * 100)}%`, background: category.color }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </Rise>
          )}

          {groups.map((g, gi) => (
            <Rise key={g.day} i={Math.min(gi + 2, 6)}>
              <section className="rounded-[28px] bg-card p-5" aria-label={g.label}>
                <div className="mb-1 flex items-baseline justify-between">
                  <h2 className="text-base font-extrabold">{g.label}</h2>
                  <Money centavos={g.total} className="text-sm font-bold text-muted" />
                </div>
                <ul>
                  {g.items.map((e) => {
                    const acc = accountOf(e.accountId);
                    return (
                      <li key={e.id}>
                        <button
                          onClick={() => setTarget(e)}
                          className="pressable flex min-h-[64px] w-full items-center gap-3 rounded-2xl py-1.5 text-left"
                          aria-label={`${categoryLabel(e.category)} ${e.note ?? ""}, open options`}
                        >
                          <CategoryIcon id={e.category} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-bold">{e.note || categoryLabel(e.category)}</span>
                            <span className="block truncate text-xs text-muted">
                              {e.note ? `${categoryLabel(e.category)} · ` : ""}
                              {acc?.name ?? "Removed account"} · {timeFmt.format(e.recordedAt)}
                            </span>
                          </span>
                          <Money centavos={-e.amountCentavos} className="font-extrabold" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </Rise>
          ))}
        </>
      )}

      <Sheet open={!!target} onClose={() => setTarget(null)} title="Expense">
        {target && (
          <div className="flex flex-col gap-4 pb-2">
            <div className="flex items-center gap-3">
              <CategoryIcon id={target.category} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{target.note || categoryLabel(target.category)}</p>
                <p className="flex items-center gap-1.5 text-sm text-sheet-muted">
                  {targetAccount && <Avatar account={targetAccount} size={20} />}
                  {targetAccount?.name ?? "Removed account"}
                </p>
              </div>
              <Money centavos={-target.amountCentavos} className="text-lg font-extrabold" />
            </div>
            <p className="text-sm text-sheet-muted">
              Removing this puts the money back into {targetAccount && !targetAccount.archivedAt ? targetAccount.name : "the account (if it still exists)"}.
              Your history keeps a record of both changes.
            </p>
            <button
              onClick={remove}
              disabled={busy}
              className="pressable min-h-[48px] rounded-2xl bg-red-500 px-5 font-bold text-white disabled:opacity-40"
            >
              Remove expense &amp; put money back
            </button>
            <SecondaryButton onClick={() => setTarget(null)}>Keep it</SecondaryButton>
          </div>
        )}
      </Sheet>
    </div>
  );
}
