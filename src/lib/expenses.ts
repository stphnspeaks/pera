import type { Expense } from "./types";
import { startOfDay } from "./networth";

export interface Category {
  id: string;
  label: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "food", label: "Food & Drinks", color: "#f59e0b" },
  { id: "groceries", label: "Groceries", color: "#22c55e" },
  { id: "transport", label: "Transport", color: "#3b82f6" },
  { id: "bills", label: "Bills", color: "#8b5cf6" },
  { id: "shopping", label: "Shopping", color: "#ec4899" },
  { id: "health", label: "Health", color: "#ef4444" },
  { id: "fun", label: "Fun", color: "#14b8a6" },
  { id: "education", label: "Education", color: "#6366f1" },
  { id: "other", label: "Other", color: "#64748b" },
];

export const getCategory = (id: string): Category =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export const categoryLabel = (id: string) => getCategory(id).label;

/** New stored balance after spending. Assets shrink; liabilities (amount owed) grow. */
export const applyExpense = (isLiability: boolean, current: number, amount: number) =>
  isLiability ? current + amount : current - amount;

const monthStart = (now: number) => {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

export function monthTotal(expenses: Expense[], now = Date.now()): number {
  const start = monthStart(now);
  return expenses
    .filter((e) => e.recordedAt >= start && e.recordedAt <= now)
    .reduce((s, e) => s + e.amountCentavos, 0);
}

export function categoryTotals(expenses: Expense[], now = Date.now()) {
  const start = monthStart(now);
  const map = new Map<string, number>();
  for (const e of expenses) {
    if (e.recordedAt < start || e.recordedAt > now) continue;
    map.set(e.category, (map.get(e.category) ?? 0) + e.amountCentavos);
  }
  return [...map.entries()]
    .map(([id, total]) => ({ category: getCategory(id), total }))
    .sort((a, b) => b.total - a.total);
}

const dayFmt = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric" });

/** Newest first, grouped by calendar day with Today / Yesterday labels. */
export function groupByDay(expenses: Expense[], now = Date.now()) {
  const today = startOfDay(now);
  const yesterday = startOfDay(today - 1);
  const groups = new Map<number, Expense[]>();
  for (const e of [...expenses].sort((a, b) => b.recordedAt - a.recordedAt)) {
    const day = startOfDay(e.recordedAt);
    groups.set(day, [...(groups.get(day) ?? []), e]);
  }
  return [...groups.entries()].map(([day, items]) => ({
    day,
    label: day === today ? "Today" : day === yesterday ? "Yesterday" : dayFmt.format(day),
    items,
    total: items.reduce((s, e) => s + e.amountCentavos, 0),
  }));
}
