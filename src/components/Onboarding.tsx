"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import config from "@config";
import { addAccounts, saveSettings } from "@/lib/db";
import { PRESETS, SWATCHES, makeInitials } from "@/lib/presets";
import { ACCOUNT_TYPES, isLiabilityType, type AccountType } from "@/lib/types";
import AmountField, { checkAmount, type AmountState } from "./AmountField";
import Logo from "./Logo";
import { Avatar, PrimaryButton } from "./ui";

interface Row {
  key: string;
  name: string;
  type: AccountType;
  color: string;
  initials?: string;
  custom?: boolean;
  amount: AmountState;
}

export default function Onboarding() {
  const [step, setStep] = useState<"pick" | "balances">("pick");
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmNeg, setConfirmNeg] = useState(false);

  const has = (key: string) => rows.some((r) => r.key === key);
  const toggle = (key: string) => {
    const p = PRESETS.find((x) => x.key === key)!;
    setRows((rs) =>
      has(key)
        ? rs.filter((r) => r.key !== key)
        : [...rs, { key, name: p.name, type: p.type, color: p.color, initials: p.initials, amount: { text: "", negative: false } }],
    );
  };
  const addCustom = () =>
    setRows((rs) => [
      ...rs,
      {
        key: `custom-${Date.now()}`,
        name: "",
        type: "Bank",
        color: SWATCHES[rs.length % SWATCHES.length],
        custom: true,
        amount: { text: "", negative: false },
      },
    ]);
  const patch = (key: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  const checks = rows.map((r) => checkAmount(r.amount, isLiabilityType(r.type)));
  const needsConfirm = checks.some((c) => c.needsConfirm);
  const incomplete = rows.some((r, i) => !r.name.trim() || checks[i].centavos === null);

  async function finish() {
    if (needsConfirm && !confirmNeg) return setConfirmNeg(true);
    setSaving(true);
    setError("");
    try {
      await addAccounts(
        rows.map((r, i) => ({
          name: r.name,
          type: r.type,
          color: r.color,
          initials: r.initials ?? makeInitials(r.name),
          balanceCentavos: checks[i].centavos ?? 0,
        })),
      );
      await saveSettings({ onboarded: true, createdAt: Date.now() });
      if (navigator.storage?.persist) void navigator.storage.persist();
    } catch {
      setError("We couldn't save your accounts. Check that your browser allows site storage and try again.");
      setSaving(false);
    }
  }

  async function skip() {
    await saveSettings({ onboarded: true, createdAt: Date.now() });
  }

  return (
    <div className="safe-top mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-[max(env(safe-area-inset-bottom),20px)]">
      <header className="flex items-center gap-3 pb-4 pt-2">
        <Logo size={36} />
        <span className="text-xl font-extrabold">{config.name}</span>
        <span className="ml-auto text-xs font-bold text-muted">Step {step === "pick" ? 1 : 2} of 2</span>
      </header>

      <AnimatePresence mode="wait">
        {step === "pick" ? (
          <motion.section
            key="pick"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">
              Where do you keep your money?
            </h1>
            <p className="mb-5 mt-2 text-muted">
              Choose the accounts you have. Everything stays on this device.
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESETS.map((p) => {
                const on = has(p.key);
                return (
                  <button
                    key={p.key}
                    onClick={() => toggle(p.key)}
                    aria-pressed={on}
                    className={`pressable relative flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-3xl p-2 ${
                      on ? "bg-white/25 ring-2 ring-white" : "bg-card"
                    }`}
                  >
                    <Avatar account={p} size={46} />
                    <span className="text-xs font-bold">{p.name}</span>
                    {on && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#1d4ed8]">
                        <Check size={13} strokeWidth={4} />
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => {
                  addCustom();
                  setStep("balances");
                }}
                className="pressable flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-white/50 p-2"
              >
                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/15">
                  <Plus />
                </span>
                <span className="text-xs font-bold">Custom</span>
              </button>
            </div>
            <div className="mt-auto flex flex-col gap-2 pt-6">
              <button
                onClick={() => setStep("balances")}
                disabled={rows.length === 0}
                className="pressable min-h-[52px] w-full rounded-2xl bg-white px-5 text-base font-extrabold text-[#1d4ed8] disabled:opacity-40"
              >
                Continue{rows.length > 0 ? ` (${rows.length})` : ""}
              </button>
              <button onClick={skip} className="pressable min-h-[44px] text-sm font-bold text-muted">
                Skip, I&apos;ll add accounts later
              </button>
            </div>
          </motion.section>
        ) : (
          <motion.section
            key="balances"
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight">What&apos;s in each one?</h1>
            <p className="mb-5 mt-2 text-muted">
              Enter today&apos;s balance. For cards and loans, enter the amount you owe.
            </p>
            <div className="flex flex-col gap-3">
              {rows.map((r) => {
                const liability = isLiabilityType(r.type);
                return (
                  <div key={r.key} className="sheet-surface rounded-3xl bg-sheet p-4 text-sheet-fg">
                    <div className="mb-3 flex items-center gap-3">
                      <Avatar account={{ color: r.color, initials: r.initials ?? makeInitials(r.name), type: r.type, name: r.name }} />
                      {r.custom ? (
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <input
                            aria-label="Account name"
                            value={r.name}
                            onChange={(e) => patch(r.key, { name: e.target.value })}
                            placeholder="Account name"
                            maxLength={30}
                            className="min-h-[44px] rounded-xl bg-sheet-field px-3 font-bold outline-none"
                          />
                          <select
                            aria-label="Account type"
                            value={r.type}
                            onChange={(e) => patch(r.key, { type: e.target.value as AccountType })}
                            className="min-h-[44px] rounded-xl bg-sheet-field px-3 font-semibold outline-none"
                          >
                            {ACCOUNT_TYPES.map((t) => (
                              <option key={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <p className="font-extrabold">{r.name}</p>
                          <p className="text-xs text-sheet-muted">{r.type}</p>
                        </div>
                      )}
                      <button
                        onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                        className="pressable min-h-[44px] px-2 text-sm font-bold text-sheet-muted"
                        aria-label={`Remove ${r.name || "account"}`}
                      >
                        Remove
                      </button>
                    </div>
                    <AmountField
                      label={liability ? "Amount owed" : "Balance"}
                      state={r.amount}
                      onChange={(a) => {
                        patch(r.key, { amount: a });
                        setConfirmNeg(false);
                      }}
                      isLiability={liability}
                    />
                  </div>
                );
              })}
              <button
                onClick={addCustom}
                className="pressable min-h-[48px] rounded-2xl border-2 border-dashed border-white/40 font-bold"
              >
                + Add another custom account
              </button>
            </div>
            {confirmNeg && (
              <p role="alert" className="mt-4 rounded-2xl bg-amber-100 p-3 text-sm font-semibold text-amber-900">
                One or more cash/bank balances are below zero. Tap again to confirm they&apos;re correct.
              </p>
            )}
            {error && (
              <p role="alert" className="mt-4 rounded-2xl bg-red-100 p-3 text-sm font-semibold text-red-800">
                {error}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <PrimaryButton
                onClick={finish}
                disabled={saving || rows.length === 0 || incomplete}
                className="!bg-white !text-[#1d4ed8] font-extrabold"
              >
                {confirmNeg ? "Yes, continue" : "See my net worth"}
              </PrimaryButton>
              <button onClick={() => setStep("pick")} className="pressable min-h-[44px] text-sm font-bold text-muted">
                Back
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
