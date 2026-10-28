"use client";

import { useEffect, useId, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { addAccount } from "@/lib/db";
import { PRESETS, SWATCHES, makeInitials } from "@/lib/presets";
import { ACCOUNT_TYPES, isLiabilityType, type AccountType } from "@/lib/types";
import AmountField, { checkAmount, type AmountState } from "./AmountField";
import Sheet from "./Sheet";
import { Avatar, PrimaryButton } from "./ui";
import { useUI } from "./ui-context";

export default function AddAccountSheet({ open }: { open: boolean }) {
  const { closeSheet, showToast } = useUI();
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("Bank");
  const [color, setColor] = useState(SWATCHES[0]);
  const [initials, setInitials] = useState<string | undefined>();
  const [amount, setAmount] = useState<AmountState>({ text: "", negative: false });
  const [confirmNeg, setConfirmNeg] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameId = useId();
  const typeId = useId();

  useEffect(() => {
    if (open) {
      setStep("pick");
      setName("");
      setType("Bank");
      setColor(SWATCHES[0]);
      setInitials(undefined);
      setAmount({ text: "", negative: false });
      setConfirmNeg(false);
    }
  }, [open]);

  const liability = isLiabilityType(type);
  const check = checkAmount(amount, liability);
  const nameOk = name.trim().length > 0;
  const canSave = nameOk && check.centavos !== null && !saving;

  async function save() {
    if (check.centavos === null) return;
    if (check.needsConfirm && !confirmNeg) {
      setConfirmNeg(true);
      return;
    }
    setSaving(true);
    try {
      await addAccount({
        name,
        type,
        color,
        initials,
        balanceCentavos: check.centavos,
      });
      showToast(`${name.trim()} added`);
      closeSheet();
    } catch {
      showToast("Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={closeSheet} title={step === "pick" ? "Add account" : "Account details"}>
      {step === "pick" ? (
        <div className="pb-2">
          <p className="mb-3 text-sm text-sheet-muted">Pick a preset or make your own.</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => {
                  setName(p.name);
                  setType(p.type);
                  setColor(p.color);
                  setInitials(p.initials);
                  setStep("form");
                }}
                className="pressable flex min-h-[84px] flex-col items-center gap-1.5 rounded-2xl p-2 text-center"
              >
                <Avatar account={p} size={46} />
                <span className="text-[11px] font-bold leading-tight">{p.name}</span>
              </button>
            ))}
            <button
              onClick={() => {
                setName("");
                setInitials(undefined);
                setStep("form");
              }}
              className="pressable flex min-h-[84px] flex-col items-center gap-1.5 rounded-2xl p-2 text-center"
            >
              <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 border-dashed border-sheet-muted text-sheet-muted">
                <Plus size={22} strokeWidth={2.5} />
              </span>
              <span className="text-[11px] font-bold leading-tight">Custom</span>
            </button>
          </div>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4 pb-2"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <button
            type="button"
            onClick={() => setStep("pick")}
            className="pressable -ml-2 flex min-h-[44px] w-fit items-center gap-1 px-2 text-sm font-bold text-sheet-muted"
          >
            <ArrowLeft size={16} /> Back to presets
          </button>
          <div className="flex items-center gap-3">
            <Avatar account={{ color, initials: initials ?? makeInitials(name), type, name }} size={52} />
            <div className="flex-1">
              <label htmlFor={nameId} className="mb-1 block text-sm font-bold text-sheet-muted">
                Name
              </label>
              <input
                id={nameId}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setInitials(undefined);
                }}
                maxLength={30}
                placeholder="e.g. BPI Savings"
                className="min-h-[48px] w-full rounded-2xl bg-sheet-field px-4 text-base font-semibold outline-none"
              />
            </div>
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
          <div>
            <span className="mb-1 block text-sm font-bold text-sheet-muted">Color</span>
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
                      boxShadow: color === c ? "0 0 0 3px var(--sheet), 0 0 0 5px #1d6fe0" : "none",
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
          <AmountField
            label={liability ? "Amount owed" : "Current balance"}
            state={amount}
            onChange={(s) => {
              setAmount(s);
              setConfirmNeg(false);
            }}
            isLiability={liability}
          />
          {confirmNeg && (
            <p role="alert" className="rounded-2xl bg-amber-100 p-3 text-sm font-semibold text-amber-900">
              This balance is below zero. Tap again to confirm it&apos;s correct.
            </p>
          )}
          <PrimaryButton type="submit" disabled={!canSave}>
            {confirmNeg ? "Yes, save negative balance" : "Add account"}
          </PrimaryButton>
        </form>
      )}
    </Sheet>
  );
}
