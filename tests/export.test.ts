import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { buildExport, fromCsv, ImportError, parseImport, toCsv, toJson } from "@/lib/export";
import { addAccount, db, loadSnapshot, recordBalance, replaceAll, resetAll, getSettings } from "@/lib/db";
import { centavosToPlain, parseCentavos, sanitizeAmountInput } from "@/lib/money";
import { makeInitials } from "@/lib/presets";
import type { Snapshot } from "@/lib/types";

const sample: Snapshot = {
  accounts: [
    { id: "a1", name: 'Joint, "Savings"', type: "Bank", isLiability: false, color: "#111", initials: "JS", createdAt: 1 },
    { id: "a2", name: "Visa", type: "Credit card", isLiability: true, color: "#222", initials: "VI", createdAt: 2, archivedAt: 99 },
  ],
  entries: [
    { id: "e1", accountId: "a1", balanceCentavos: 123_456_78, recordedAt: Date.UTC(2026, 0, 1), note: "line1\nline2, with comma" },
    { id: "e2", accountId: "a1", balanceCentavos: -5_05, recordedAt: Date.UTC(2026, 0, 2) },
    { id: "e3", accountId: "a2", balanceCentavos: 9_00, recordedAt: Date.UTC(2026, 0, 3) },
  ],
};

describe("JSON round trip", () => {
  it("export then import returns the same data", () => {
    const text = toJson(buildExport(sample));
    const back = parseImport(text);
    expect(back.accounts).toEqual(sample.accounts);
    expect(back.entries).toEqual(sample.entries);
  });

  it("rejects junk and damaged files with friendly errors", () => {
    expect(() => parseImport("nope")).toThrow(ImportError);
    expect(() => parseImport('{"hello":1}')).toThrow(/backup/);
    const bad = JSON.parse(toJson(buildExport(sample)));
    bad.entries[0].accountId = "ghost";
    expect(() => parseImport(JSON.stringify(bad))).toThrow(/damaged/);
  });
});

describe("CSV round trip", () => {
  it("escapes quotes, commas and newlines and reads them back", () => {
    const csv = toCsv(sample);
    expect(csv.split("\r\n")[0]).toBe("account_id,account,type,archived,recorded_at,balance_php,note");
    const back = fromCsv(csv, () => "#000", makeInitials);
    expect(back.accounts.map((a) => [a.id, a.name, a.type, a.isLiability, !!a.archivedAt])).toEqual([
      ["a1", 'Joint, "Savings"', "Bank", false, false],
      ["a2", "Visa", "Credit card", true, true],
    ]);
    expect(back.entries.map((e) => [e.accountId, e.balanceCentavos, e.recordedAt, e.note])).toEqual(
      sample.entries.map((e) => [e.accountId, e.balanceCentavos, e.recordedAt, e.note]),
    );
  });
});

describe("money parsing", () => {
  it("parses to exact centavos", () => {
    expect(parseCentavos("1,234.5")).toBe(123_450);
    expect(parseCentavos("0.07")).toBe(7);
    expect(parseCentavos("19.99")).toBe(1999);
    expect(parseCentavos("")).toBeNull();
    expect(parseCentavos("abc")).toBeNull();
    expect(centavosToPlain(-5)).toBe("-0.05");
  });
  it("strips letters while typing", () => {
    expect(sanitizeAmountInput("12a3.4b567")).toBe("123.45");
    expect(sanitizeAmountInput("1.2.3")).toBe("1.23");
  });
});

describe("database import", () => {
  beforeEach(async () => {
    await resetAll();
  });

  it("replaceAll restores a snapshot and never imports a PIN", async () => {
    await replaceAll(sample, { theme: "dark", pinHash: "evil" } as never);
    const snap = await loadSnapshot();
    expect(snap.entries).toHaveLength(3);
    const s = await getSettings();
    expect(s.theme).toBe("dark");
    expect(s.pinHash).toBeUndefined();
    expect(s.onboarded).toBe(true);
  });

  it("keeps history when an account is created and updated", async () => {
    const a = await addAccount({ name: "GCash", type: "E-wallet", color: "#00f", balanceCentavos: 100 });
    await recordBalance(a.id, 250, " paid ");
    const entries = await db.entries.toArray();
    expect(entries.map((e) => e.balanceCentavos).sort()).toEqual([100, 250]);
    expect(entries.find((e) => e.balanceCentavos === 250)?.note).toBe("paid");
  });
});
