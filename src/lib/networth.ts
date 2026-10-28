import type { Account, BalanceEntry } from "./types";

export const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Last entry of each account recorded at or before `at` (default: now). */
export function balancesAt(
  accounts: Account[],
  entries: BalanceEntry[],
  at = Infinity,
): Map<string, number> {
  const latest = new Map<string, BalanceEntry>();
  for (const e of entries) {
    if (e.recordedAt > at) continue;
    const cur = latest.get(e.accountId);
    if (!cur || e.recordedAt >= cur.recordedAt) latest.set(e.accountId, e);
  }
  const out = new Map<string, number>();
  for (const a of accounts) {
    if (a.archivedAt !== undefined && a.archivedAt <= at) continue;
    const e = latest.get(a.id);
    if (e) out.set(a.id, e.balanceCentavos);
  }
  return out;
}

export interface Totals {
  assets: number;
  liabilities: number;
  net: number;
}

export function totalsAt(accounts: Account[], entries: BalanceEntry[], at = Infinity): Totals {
  const balances = balancesAt(accounts, entries, at);
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    const b = balances.get(a.id);
    if (b === undefined) continue;
    if (a.isLiability) liabilities += b;
    else assets += b;
  }
  return { assets, liabilities, net: assets - liabilities };
}

export const netWorth = (accounts: Account[], entries: BalanceEntry[], at = Infinity) =>
  totalsAt(accounts, entries, at).net;

export interface Change {
  amount: number;
  /** null when there is no baseline to compare against (or it was zero) */
  percent: number | null;
  basis: "yesterday" | "last-update" | "none";
}

/**
 * Change versus the previous day's closing total. If nothing was recorded before
 * today, compares with the total just before the most recent update instead.
 */
export function changeSincePreviousDay(
  accounts: Account[],
  entries: BalanceEntry[],
  now = Date.now(),
): Change {
  const active = entries.filter(
    (e) => e.recordedAt <= now && accounts.some((a) => a.id === e.accountId),
  );
  if (active.length === 0) return { amount: 0, percent: null, basis: "none" };
  const current = netWorth(accounts, entries, now);
  const todayStart = startOfDay(now);

  let baseline: number | null = null;
  let basis: Change["basis"] = "none";
  if (active.some((e) => e.recordedAt < todayStart)) {
    baseline = netWorth(accounts, entries, todayStart - 1);
    basis = "yesterday";
  } else {
    const lastTs = Math.max(...active.map((e) => e.recordedAt));
    if (active.some((e) => e.recordedAt < lastTs)) {
      baseline = netWorth(accounts, entries, lastTs - 1);
      basis = "last-update";
    }
  }
  if (baseline === null) return { amount: 0, percent: null, basis: "none" };
  const amount = current - baseline;
  const percent = baseline === 0 ? null : (amount / Math.abs(baseline)) * 100;
  return { amount, percent, basis };
}

export interface MonthPoint {
  key: string; // YYYY-MM
  label: string; // Jan
  value: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Net worth at the end of each of the last `months` months (the current month ends now). */
export function monthEndSeries(
  accounts: Account[],
  entries: BalanceEntry[],
  months = 6,
  now = Date.now(),
): MonthPoint[] {
  const base = new Date(now);
  const out: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const first = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const end = Math.min(
      new Date(first.getFullYear(), first.getMonth() + 1, 1).getTime() - 1,
      now,
    );
    out.push({
      key: `${first.getFullYear()}-${String(first.getMonth() + 1).padStart(2, "0")}`,
      label: MONTHS[first.getMonth()],
      value: netWorth(accounts, entries, end),
    });
  }
  return out;
}

export interface HistoryRow {
  entry: BalanceEntry;
  account?: Account;
  previous: number | null;
  delta: number;
}

/** Newest first, each with the balance it replaced. */
export function historyRows(accounts: Account[], entries: BalanceEntry[]): HistoryRow[] {
  const byAccount = new Map<string, BalanceEntry[]>();
  for (const e of entries) {
    const list = byAccount.get(e.accountId) ?? [];
    list.push(e);
    byAccount.set(e.accountId, list);
  }
  const rows: HistoryRow[] = [];
  const names = new Map(accounts.map((a) => [a.id, a]));
  for (const [id, list] of byAccount) {
    list.sort((a, b) => a.recordedAt - b.recordedAt);
    list.forEach((entry, i) => {
      const previous = i > 0 ? list[i - 1].balanceCentavos : null;
      rows.push({
        entry,
        account: names.get(id),
        previous,
        delta: entry.balanceCentavos - (previous ?? 0),
      });
    });
  }
  return rows.sort((a, b) => b.entry.recordedAt - a.entry.recordedAt);
}
