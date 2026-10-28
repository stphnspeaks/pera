"use client";

import { useEffect, useId, useRef, useState } from "react";
import { recordExpense } from "@/lib/db";
import { CATEGORIES, applyExpense } from "@/lib/expenses";
import { formatPHP } from "@/lib/money";
import AmountField, { checkAmount, type AmountState } from "./AmountField";
import CategoryIcon from "./CategoryIcon";
import { useData } from "./DataProvider";
import Sheet from "./Sheet";
import { Check } from "lucide-react";
import { Avatar, PrimaryButton, shade } from "./ui";
import { useUI } from "./ui-context";

const LAST_ACCOUNT_KEY = "pera-last-expense-account";

export default function AddExpenseSheet({ open }: { open: boolean }) {
  const { closeSheet, showToast } = useUI();
  const { accounts, balances } = useData();
  const [amount, setAmount] = useState<AmountState>({ text: "", negative: false });
  const [category, setCategory] = useState("food");
  const [accountId, setAccountId] = useState<string>("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const noteId = useId();
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setAmount({ text: "", negative: false });
    setCategory("food");
    setNote("");
    setConfirm(false);
    let remembered = "";
    try {
      remembered = localStorage.getItem(LAST_ACCOUNT_KEY) ?? "";
    } catch {}
    const spendable = accounts.filter((a) => !a.isLiability);
    setAccountId(
      accounts.some((a) => a.id === remembered)
        ? remembered
        : (spendable[0]?.id ?? accounts[0]?.id ?? ""),
    );
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the chosen account card in view (the row scrolls sideways)
  useEffect(() => {
    if (!open || !accountId) return;
    const t = window.setTimeout(() => {
      rowRef.current
        ?.querySelector('[aria-checked="true"]')
        ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }, 350);
    return () => window.clearTimeout(t);
  }, [open, accountId]);

  const account = accounts.find((a) => a.id === accountId);
  const check = checkAmount(amount, false);
  const spend = check.centavos !== null && check.centavos > 0 ? check.centavos : null;
  const current = account ? (balances.get(account.id) ?? 0) : 0;
  const after = account && spend ? applyExpense(account.isLiability, current, spend) : null;
  const overdraws = !!account && !account.isLiability && after !== null && after < 0;
  const canSave = !!account && spend !== null && !busy;

  async function save() {
    if (!account || spend === null) return;
    if (overdraws && !confirm) return setConfirm(true);
    setBusy(true);
    try {
      await recordExpense({ accountId: account.id, amountCentavos: spend, category, note });
      try {
        localStorage.setItem(LAST_ACCOUNT_KEY, account.id);
      } catch {}
      showToast(`${formatPHP(spend)} taken from ${account.name}`);
      closeSheet();
    } catch {
      showToast("Couldn't save the expense. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={closeSheet} title="Add expense">
      {accounts.length === 0 ? (
        <p className="pb-4 text-sm text-sheet-muted">Add an account first, then you can log what you spend from it.</p>
      ) : (
        <form
          className="flex flex-col gap-5 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <AmountField
            label="How much did you spend?"
            state={amount}
            onChange={(s) => {
              setAmount({ ...s, negative: false });
              setConfirm(false);
            }}
            isLiability={false}
            allowNegative={false}
            autoFocus
          />

          <div>
            <span className="mb-2 block text-sm font-bold text-sheet-muted">Category</span>
            <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((c) => {
                const on = category === c.id;
                return (
                  <button
                    type="button"
                    key={c.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setCategory(c.id)}
                    className={`pressable flex min-h-[84px] flex-col items-center justify-center gap-1.5 rounded-3xl p-2 text-center ${
                      on ? "text-white" : "bg-sheet-field"
                    }`}
                    style={
                      on
                        ? {
                            background: `linear-gradient(150deg, ${shade(c.color, 0.15)}, ${shade(c.color, -0.2)})`,
                            boxShadow: `0 12px 22px -10px ${c.color}, inset 0 1px 0 rgba(255,255,255,0.35)`,
                          }
                        : undefined
                    }
                  >
                    <CategoryIcon id={c.id} size={36} ghost={on} />
                    <span className="text-[11px] font-extrabold leading-tight">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-sm font-bold text-sheet-muted">Paid from</span>
            <div
              ref={rowRef}
              className="no-scrollbar -mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-3 pt-1"
              role="radiogroup"
              aria-label="Paid from"
            >
              {accounts.map((a) => {
                const on = a.id === accountId;
                return (
                  <button
                    type="button"
                    key={a.id}
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setAccountId(a.id);
                      setConfirm(false);
                    }}
                    className={`pressable relative flex h-[104px] w-[158px] shrink-0 snap-start flex-col justify-between rounded-3xl p-3.5 text-left text-white transition-opacity ${
                      on ? "opacity-100 ring-[3px] ring-white/90 ring-offset-2 ring-offset-[#1d6fe0]" : "opacity-60"
                    }`}
                    style={{
                      background: `linear-gradient(145deg, ${shade(a.color, 0.2)} 0%, ${a.color} 45%, ${shade(a.color, -0.35)} 100%)`,
                      boxShadow: `0 14px 24px -12px ${a.color}`,
                    }}
                  >
                    <span className="flex items-center justify-between">
                      <Avatar account={a} size={30} />
                      {on && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1d4ed8]">
                          <Check size={14} strokeWidth={4} />
                        </span>
                      )}
                    </span>
                    <span>
                      <span className="block truncate text-sm font-extrabold leading-tight">{a.name}</span>
                      <span className="num block text-xs font-semibold text-white/85">
                        {a.isLiability ? "Owed " : ""}
                        {formatPHP(balances.get(a.id) ?? 0)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor={noteId} className="mb-1 block text-sm font-bold text-sheet-muted">
              Note (optional)
            </label>
            <input
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              placeholder="e.g. Lunch with team"
              className="min-h-[52px] w-full rounded-2xl bg-sheet-field px-4 text-base text-sheet-fg outline-none placeholder:text-sheet-muted/60"
            />
          </div>

          {account && after !== null && (
            <p className="rounded-3xl bg-sheet-field p-4 text-sm leading-relaxed text-sheet-muted" aria-live="polite">
              {account.isLiability ? "You'll owe" : "New balance of"} <b className="text-sheet-fg">{account.name}</b>:{" "}
              <b className="num text-sheet-fg">{formatPHP(after)}</b>
              <br />
              Your net worth drops by <b className="num text-sheet-fg">{formatPHP(spend ?? 0)}</b>.
            </p>
          )}
          {confirm && (
            <p role="alert" className="rounded-2xl bg-amber-100 p-3 text-sm font-semibold text-amber-900">
              This is more than the balance in {account?.name}, so it will go below zero. Tap again to confirm.
            </p>
          )}

          <PrimaryButton type="submit" disabled={!canSave}>
            {confirm ? "Yes, add anyway" : "Add expense"}
          </PrimaryButton>
        </form>
      )}
    </Sheet>
  );
}
