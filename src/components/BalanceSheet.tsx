"use client";

import { useEffect, useId, useState } from "react";
import { centavosToPlain } from "@/lib/money";
import { deleteAccount, recordBalance, updateAccount } from "@/lib/db";
import { SWATCHES } from "@/lib/presets";
import { ACCOUNT_TYPES, isLiabilityType, type AccountType } from "@/lib/types";
import AmountField, { checkAmount, type AmountState } from "./AmountField";
import { useData } from "./DataProvider";
import Money from "./Money";
import Sheet from "./Sheet";
import { Avatar, PrimaryButton, SecondaryButton } from "./ui";
import { useUI } from "./ui-context";

export default function BalanceSheet({ accountId }: { accountId: string | null }) {
  const { closeSheet, showToast, setTab, setHistoryFilter } = useUI();
  const { accounts, balances } = useData();
  const account = accounts.find((a) => a.id === accountId);
  const current = accountId ? (balances.get(accountId) ?? 0) : 0;

  const [mode, setMode] = useState<"balance" | "edit" | "delete">("balance");
  const [amount, setAmount] = useState<AmountState>({ text: "", negative: false });
  const [note, setNote] = useState("");
  const [confirmNeg, setConfirmNeg] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Bank");
  const [color, setColor] = useState(SWATCHES[0]);
  const noteId = useId();
  const nameId = useId();
  const typeId = useId();

  const open = !!accountId && !!account;
  useEffect(() => {
    if (!accountId) return;
    setMode("balance");
    setAmount({ text: centavosToPlain(Math.abs(current)), negative: current < 0 });
    setNote("");
    setConfirmNeg(false);
  }, [accountId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (account) {
      setName(account.name);
      setType(account.type);
      setColor(account.color);
    }
  }, [account?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!account) return <Sheet open={false} onClose={closeSheet} title="Update balance">{null}</Sheet>;

  const check = checkAmount(amount, account.isLiability);
  const unchanged = check.centavos === current;
  const canSave = check.centavos !== null && !unchanged && !busy;

  async function saveBalance() {
    if (check.centavos === null || !account) return;
    if (check.needsConfirm && !confirmNeg) return setConfirmNeg(true);
    setBusy(true);
    try {
      await recordBalance(account.id, check.centavos, note);
      showToast(`${account.name} updated`);
      closeSheet();
    } catch {
      showToast("Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function saveDetails() {
    if (!account || !name.trim()) return;
    setBusy(true);
    try {
      await updateAccount(account.id, { name: name.trim(), type, color });
      showToast("Account saved");
      setMode("balance");
    } finally {
      setBusy(false);
    }
  }

  async function remove(keepHistory: boolean) {
    if (!account) return;
    setBusy(true);
    try {
      await deleteAccount(account.id, keepHistory);
      showToast(keepHistory ? "Account removed, history kept" : "Account and history deleted");
      closeSheet();
    } finally {
      setBusy(false);
    }
  }

  const title = mode === "balance" ? "Update balance" : mode === "edit" ? "Edit account" : "Delete account";

  return (
    <Sheet open={open} onClose={closeSheet} title={title}>
      <div className="mb-4 flex items-center gap-3">
        <Avatar account={account} size={48} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold">{account.name}</p>
          <p className="text-sm text-sheet-muted">
            {account.type} ·{" "}
            <Money centavos={current} className="font-bold" decimalClassName="opacity-60" />
          </p>
        </div>
      </div>

      {mode === "balance" && (
        <form
          className="flex flex-col gap-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            void saveBalance();
          }}
        >
          <AmountField
            label={account.isLiability ? "New amount owed" : "New balance"}
            state={amount}
            onChange={(s) => {
              setAmount(s);
              setConfirmNeg(false);
            }}
            isLiability={account.isLiability}
            autoFocus
          />
          <div>
            <label htmlFor={noteId} className="mb-1 block text-sm font-bold text-sheet-muted">
              Note (optional)
            </label>
            <input
              id={noteId}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={80}
              placeholder="e.g. Salary came in"
              className="min-h-[48px] w-full rounded-2xl bg-sheet-field px-4 text-base outline-none"
            />
          </div>
          {confirmNeg && (
            <p role="alert" className="rounded-2xl bg-amber-100 p-3 text-sm font-semibold text-amber-900">
              This balance is below zero. Tap again to confirm it&apos;s correct.
            </p>
          )}
          <PrimaryButton type="submit" disabled={!canSave}>
            {confirmNeg ? "Yes, save negative balance" : unchanged ? "Enter a new balance" : "Save balance"}
          </PrimaryButton>
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton
              type="button"
              onClick={() => {
                setHistoryFilter(account.id);
                setTab("history");
                closeSheet();
              }}
            >
              History
            </SecondaryButton>
            <SecondaryButton type="button" onClick={() => setMode("edit")}>
              Edit details
            </SecondaryButton>
          </div>
        </form>
      )}

      {mode === "edit" && (
        <form
          className="flex flex-col gap-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            void saveDetails();
          }}
        >
          <div>
            <label htmlFor={nameId} className="mb-1 block text-sm font-bold text-sheet-muted">
              Name
            </label>
            <input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              className="min-h-[48px] w-full rounded-2xl bg-sheet-field px-4 text-base font-semibold outline-none"
            />
          </div>
          <div>
            <label htmlFor={typeId} className="mb-1 block text-sm font-bold text-sheet-muted">
              Type
            </label>
            <select
              id={typeId}
              value={type}
              onChange={(e) => setType(e.target.value as AccountType)}
              className="min-h-[48px] w-full rounded-2xl bg-sheet-field px-4 text-base font-semibold outline-none"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                  {isLiabilityType(t) ? " (liability)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1">
            {SWATCHES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className="flex h-11 w-11 items-center justify-center rounded-full"
              >
                <span
                  className="block h-8 w-8 rounded-full"
                  style={{
                    background: c,
                    boxShadow: color === c ? "0 0 0 3px var(--sheet), 0 0 0 5px var(--brand)" : "none",
                  }}
                />
              </button>
            ))}
          </div>
          <PrimaryButton type="submit" disabled={!name.trim() || busy}>
            Save changes
          </PrimaryButton>
          <div className="grid grid-cols-2 gap-2">
            <SecondaryButton type="button" onClick={() => setMode("balance")}>
              Cancel
            </SecondaryButton>
            <button
              type="button"
              onClick={() => setMode("delete")}
              className="pressable min-h-[48px] rounded-2xl bg-red-500/15 px-5 font-bold text-red-500"
            >
              Delete…
            </button>
          </div>
        </form>
      )}

      {mode === "delete" && (
        <div className="flex flex-col gap-3 pb-2">
          <p className="text-sm text-sheet-muted">
            Do you want to keep this account&apos;s history? Kept history stays in your timeline and past
            monthly totals; the account just stops counting toward your net worth.
          </p>
          <PrimaryButton onClick={() => remove(true)} disabled={busy}>
            Remove account, keep history
          </PrimaryButton>
          <button
            onClick={() => remove(false)}
            disabled={busy}
            className="pressable min-h-[48px] rounded-2xl bg-red-500 px-5 font-bold text-white disabled:opacity-40"
          >
            Delete account and history
          </button>
          <SecondaryButton onClick={() => setMode("edit")}>Cancel</SecondaryButton>
        </div>
      )}
    </Sheet>
  );
}
