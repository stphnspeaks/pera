import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { addAccount, db, deleteExpense, loadSnapshot, recordExpense, resetAll } from "@/lib/db";
import { applyExpense, groupByDay, monthTotal } from "@/lib/expenses";
import { buildExport, parseImport, toJson } from "@/lib/export";
import { netWorth } from "@/lib/networth";
import type { Expense } from "@/lib/types";

const net = async () => {
  const s = await loadSnapshot();
  return netWorth(s.accounts, s.entries);
};

describe("expenses", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("applyExpense lowers assets and raises liabilities", () => {
    expect(applyExpense(false, 1000, 250)).toBe(750);
    expect(applyExpense(true, 1000, 250)).toBe(1250);
  });

  it("deducts from the chosen account and net worth follows", async () => {
    const bank = await addAccount({ name: "BPI", type: "Bank", color: "#000", balanceCentavos: 1_000_00 });
    const cash = await addAccount({ name: "Cash", type: "Cash", color: "#000", balanceCentavos: 200_00 });
    expect(await net()).toBe(1_200_00);

    await recordExpense({ accountId: cash.id, amountCentavos: 75_50, category: "food", note: "lunch" });
    expect(await net()).toBe(1_124_50);
    const snap = await loadSnapshot();
    const cashNow = snap.entries
      .filter((e) => e.accountId === cash.id)
      .sort((a, b) => b.recordedAt - a.recordedAt)[0];
    expect(cashNow.balanceCentavos).toBe(124_50);
    expect(cashNow.expenseId).toBeDefined();
    expect(snap.entries.find((e) => e.accountId === bank.id)?.balanceCentavos).toBe(1_000_00);
  });

  it("credit card spending increases what you owe", async () => {
    await addAccount({ name: "BDO", type: "Bank", color: "#000", balanceCentavos: 500_00 });
    const card = await addAccount({ name: "Visa", type: "Credit card", color: "#000", balanceCentavos: 100_00 });
    await recordExpense({ accountId: card.id, amountCentavos: 50_00, category: "shopping" });
    expect(await net()).toBe(500_00 - 150_00);
  });

  it("deleting an expense restores the balance and keeps history", async () => {
    const bank = await addAccount({ name: "BPI", type: "Bank", color: "#000", balanceCentavos: 1_000_00 });
    const exp = await recordExpense({ accountId: bank.id, amountCentavos: 300_00, category: "bills" });
    expect(await net()).toBe(700_00);
    await deleteExpense(exp.id);
    expect(await net()).toBe(1_000_00);
    expect(await db.expenses.count()).toBe(0);
    expect(await db.entries.count()).toBe(3);
  });

  it("back-to-back expenses at the same instant stack correctly", async () => {
    const bank = await addAccount({ name: "BPI", type: "Bank", color: "#000", balanceCentavos: 100_00 }, 1000);
    await recordExpense({ accountId: bank.id, amountCentavos: 10_00, category: "food" }, 2000);
    await recordExpense({ accountId: bank.id, amountCentavos: 10_00, category: "food" }, 2000);
    expect(await net()).toBe(80_00);
  });

  it("survives JSON export/import", async () => {
    const bank = await addAccount({ name: "BPI", type: "Bank", color: "#000", balanceCentavos: 100_00 });
    await recordExpense({ accountId: bank.id, amountCentavos: 5_00, category: "fun", note: "movie" });
    const snap = await loadSnapshot();
    const back = parseImport(toJson(buildExport(snap)));
    expect(back.expenses).toEqual(snap.expenses);
    expect(back.entries.filter((e) => e.expenseId)).toHaveLength(1);
  });
});

describe("expense summaries", () => {
  const at = (m: number, d: number, h = 12) => new Date(2026, m - 1, d, h).getTime();
  const mk = (id: string, amount: number, t: number): Expense => ({
    id,
    accountId: "a",
    amountCentavos: amount,
    category: "food",
    recordedAt: t,
  });
  const list = [mk("1", 100, at(5, 3)), mk("2", 200, at(5, 10)), mk("3", 400, at(4, 28)), mk("4", 50, at(5, 10, 8))];

  it("totals only the current month", () => {
    expect(monthTotal(list, at(5, 12))).toBe(350);
  });

  it("groups by day with friendly labels", () => {
    const g = groupByDay(list, at(5, 11));
    expect(g[0].label).toBe("Yesterday");
    expect(g[0].total).toBe(250);
    expect(g.map((x) => x.items.length)).toEqual([2, 1, 1]);
  });
});
