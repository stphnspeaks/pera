import { describe, expect, it } from "vitest";
import {
  changeSincePreviousDay,
  historyRows,
  monthEndSeries,
  netWorth,
  totalsAt,
} from "@/lib/networth";
import type { Account, BalanceEntry } from "@/lib/types";

const acct = (id: string, isLiability = false, extra: Partial<Account> = {}): Account => ({
  id,
  name: id,
  type: isLiability ? "Credit card" : "Bank",
  isLiability,
  color: "#000",
  initials: id.slice(0, 2).toUpperCase(),
  createdAt: 0,
  ...extra,
});
const entry = (accountId: string, balanceCentavos: number, recordedAt: number): BalanceEntry => ({
  id: `${accountId}-${recordedAt}`,
  accountId,
  balanceCentavos,
  recordedAt,
});
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

describe("net worth", () => {
  const accounts = [acct("bpi"), acct("gcash"), acct("card", true)];

  it("subtracts liabilities from assets using the latest entry", () => {
    const entries = [
      entry("bpi", 100_000_00, at(2026, 1, 1)),
      entry("bpi", 120_000_00, at(2026, 1, 5)),
      entry("gcash", 5_000_50, at(2026, 1, 2)),
      entry("card", 20_000_25, at(2026, 1, 3)),
    ];
    expect(totalsAt(accounts, entries)).toEqual({
      assets: 125_000_50,
      liabilities: 20_000_25,
      net: 105_000_25,
    });
  });

  it("is exact for tricky centavo sums", () => {
    const entries = [entry("bpi", 10, 1), entry("gcash", 20, 1)];
    expect(netWorth(accounts, entries)).toBe(30);
  });

  it("ignores archived accounts from the archive date on, keeps them before", () => {
    const list = [acct("old", false, { archivedAt: at(2026, 2, 1) }), acct("bpi")];
    const entries = [entry("old", 50_00, at(2026, 1, 1)), entry("bpi", 10_00, at(2026, 1, 1))];
    expect(netWorth(list, entries, at(2026, 1, 15))).toBe(60_00);
    expect(netWorth(list, entries, at(2026, 3, 1))).toBe(10_00);
  });

  it("is 0 with no accounts", () => {
    expect(netWorth([], [])).toBe(0);
  });
});

describe("change since previous day", () => {
  const accounts = [acct("bpi"), acct("card", true)];
  const now = at(2026, 5, 10, 15);

  it("compares with the closing total of the previous day", () => {
    const entries = [
      entry("bpi", 1000_00, at(2026, 5, 8)),
      entry("bpi", 1100_00, at(2026, 5, 9, 20)),
      entry("bpi", 1300_00, at(2026, 5, 10, 9)),
      entry("card", 100_00, at(2026, 5, 10, 10)),
    ];
    const c = changeSincePreviousDay(accounts, entries, now);
    expect(c.basis).toBe("yesterday");
    expect(c.amount).toBe(1200_00 - 1100_00);
    expect(c.percent).toBeCloseTo((100 / 1100) * 100);
  });

  it("falls back to the last update when everything was recorded today", () => {
    const entries = [
      entry("bpi", 1000_00, at(2026, 5, 10, 8)),
      entry("bpi", 1250_00, at(2026, 5, 10, 11)),
    ];
    const c = changeSincePreviousDay(accounts, entries, now);
    expect(c.basis).toBe("last-update");
    expect(c.amount).toBe(250_00);
  });

  it("reports no change for a single onboarding batch", () => {
    const entries = [entry("bpi", 1000_00, at(2026, 5, 10, 8)), entry("card", 5_00, at(2026, 5, 10, 8))];
    expect(changeSincePreviousDay(accounts, entries, now)).toEqual({
      amount: 0,
      percent: null,
      basis: "none",
    });
  });

  it("has a null percent when the baseline was zero", () => {
    const entries = [entry("bpi", 0, at(2026, 5, 9)), entry("bpi", 500_00, at(2026, 5, 10, 9))];
    const c = changeSincePreviousDay(accounts, entries, now);
    expect(c.amount).toBe(500_00);
    expect(c.percent).toBeNull();
  });
});

describe("month-end series", () => {
  const accounts = [acct("bpi"), acct("gcash")];
  const now = at(2026, 6, 15);
  const entries = [
    entry("bpi", 100_00, at(2026, 3, 10)),
    entry("bpi", 150_00, at(2026, 3, 31, 23)), // last of March
    entry("bpi", 900_00, at(2026, 4, 1, 0)),
    entry("gcash", 20_00, at(2026, 4, 20)),
    entry("bpi", 400_00, at(2026, 6, 2)),
  ];

  it("uses the last recorded balance of each account at each month end", () => {
    const s = monthEndSeries(accounts, entries, 4, now);
    expect(s.map((p) => p.key)).toEqual(["2026-03", "2026-04", "2026-05", "2026-06"]);
    expect(s.map((p) => p.label)).toEqual(["Mar", "Apr", "May", "Jun"]);
    expect(s.map((p) => p.value)).toEqual([150_00, 920_00, 920_00, 420_00]);
  });

  it("is 0 before any history exists and spans year boundaries", () => {
    const s = monthEndSeries(accounts, entries, 12, now);
    expect(s).toHaveLength(12);
    expect(s[0].key).toBe("2025-07");
    expect(s[0].value).toBe(0);
  });
});

describe("history rows", () => {
  it("lists newest first with previous balance and delta", () => {
    const accounts = [acct("bpi")];
    const rows = historyRows(accounts, [
      entry("bpi", 100, 1),
      entry("bpi", 250, 2),
      entry("bpi", 200, 3),
    ]);
    expect(rows.map((r) => r.entry.balanceCentavos)).toEqual([200, 250, 100]);
    expect(rows.map((r) => r.delta)).toEqual([-50, 150, 100]);
    expect(rows[2].previous).toBeNull();
  });
});
