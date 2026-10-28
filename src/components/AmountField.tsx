"use client";

import { useId } from "react";
import { formatPHP, parseCentavos, sanitizeAmountInput } from "@/lib/money";

export interface AmountState {
  text: string;
  negative: boolean;
}

export interface AmountCheck {
  centavos: number | null;
  error?: string;
  /** asset accounts need an explicit confirmation to go below zero */
  needsConfirm: boolean;
}

export function checkAmount(state: AmountState, isLiability: boolean): AmountCheck {
  if (state.text.trim() === "") return { centavos: null, needsConfirm: false };
  const abs = parseCentavos(state.text);
  if (abs === null) {
    return { centavos: null, error: "Enter a valid amount, like 1,250.50", needsConfirm: false };
  }
  const centavos = state.negative && abs !== 0 ? -abs : abs;
  return { centavos, needsConfirm: centavos < 0 && !isLiability };
}

export default function AmountField({
  label,
  state,
  onChange,
  isLiability,
  error,
  autoFocus,
  allowNegative = true,
}: {
  label: string;
  state: AmountState;
  onChange: (s: AmountState) => void;
  isLiability: boolean;
  error?: string;
  autoFocus?: boolean;
  allowNegative?: boolean;
}) {
  const id = useId();
  const check = checkAmount(state, isLiability);
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold text-sheet-muted">
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-[28px] bg-sheet-field px-5 py-2 ${error ? "ring-2 ring-red-500" : ""}`}
      >
        <span className="absolute left-5 text-2xl font-extrabold text-sheet-muted">
          {state.negative ? "−₱" : "₱"}
        </span>
        <input
          id={id}
          value={state.text}
          onChange={(e) => onChange({ ...state, text: sanitizeAmountInput(e.target.value) })}
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0.00"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : undefined}
          className="num min-h-[76px] w-full bg-transparent px-8 text-center text-[44px] font-extrabold tracking-tight text-sheet-fg outline-none placeholder:text-sheet-muted/40"
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p
          id={`${id}-err`}
          role={error ? "alert" : undefined}
          className={`text-sm ${error ? "font-semibold text-red-500" : "text-sheet-muted"}`}
        >
          {error ?? (check.centavos !== null ? formatPHP(check.centavos) : "Type the amount")}
        </p>
        {allowNegative && (
          <button
            type="button"
            onClick={() => onChange({ ...state, negative: !state.negative })}
            aria-pressed={state.negative}
            className={`pressable min-h-[44px] shrink-0 rounded-full px-4 text-sm font-bold ${
              state.negative ? "bg-[#1d6fe0] text-white" : "bg-sheet-field text-sheet-fg"
            }`}
          >
            {isLiability ? "Credit (overpaid)" : "Negative"}
          </button>
        )}
      </div>
    </div>
  );
}
