/** All money is integer centavos. Parsing never goes through floats. */

const currency = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
const compact = new Intl.NumberFormat("en-PH", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatPHP = (centavos: number) => currency.format(centavos / 100);

export const formatCompact = (centavos: number) => `₱${compact.format(centavos / 100)}`;

/** Splits a formatted amount so the decimals can be dimmed. */
export function splitMoney(centavos: number): { whole: string; decimals: string } {
  const parts = currency.formatToParts(centavos / 100);
  let whole = "";
  let decimals = "";
  let seenDecimal = false;
  for (const p of parts) {
    if (p.type === "decimal") seenDecimal = true;
    if (seenDecimal) decimals += p.value;
    else whole += p.value;
  }
  return { whole, decimals };
}

/** Keeps only digits and a single dot, with at most 2 decimals. Letters are dropped. */
export function sanitizeAmountInput(raw: string): string {
  let out = raw.replace(/[^0-9.]/g, "");
  const dot = out.indexOf(".");
  if (dot !== -1) {
    out = out.slice(0, dot + 1) + out.slice(dot + 1).replace(/\./g, "");
    const [w, f] = out.split(".");
    out = `${w}.${f.slice(0, 2)}`;
  }
  return out;
}

/** "1234.5" -> 123450. Returns null if empty or invalid. */
export function parseCentavos(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  if (!/^\d*\.?\d{0,2}$/.test(s) || s === "" || s === ".") return null;
  const [w = "", f = ""] = s.split(".");
  const whole = Number(w || "0");
  const frac = Number(f.padEnd(2, "0") || "0");
  const total = whole * 100 + frac;
  return Number.isSafeInteger(total) ? total : null;
}

/** Centavos -> "1234.50" (for CSV / editing). Exact, no floats. */
export function centavosToPlain(c: number): string {
  const sign = c < 0 ? "-" : "";
  const abs = Math.abs(c);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export const MASK = "••••";
