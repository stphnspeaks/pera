import Dexie, { type Table } from "dexie";
import {
  defaultSettings,
  isLiabilityType,
  type Account,
  type AccountType,
  type BalanceEntry,
  type Expense,
  type Settings,
  type Snapshot,
} from "./types";
import { makeInitials } from "./presets";
import { applyExpense, categoryLabel } from "./expenses";

type SettingsRow = Settings & { key: "main" };

class PeraDB extends Dexie {
  accounts!: Table<Account, string>;
  entries!: Table<BalanceEntry, string>;
  expenses!: Table<Expense, string>;
  settings!: Table<SettingsRow, string>;

  constructor() {
    super("pera");
    this.version(1).stores({
      accounts: "id, archivedAt",
      entries: "id, accountId, recordedAt",
      settings: "key",
    });
    this.version(2).stores({
      accounts: "id, archivedAt",
      entries: "id, accountId, recordedAt",
      expenses: "id, accountId, recordedAt",
      settings: "key",
    });
  }
}

export const db = new PeraDB();

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get("main");
  if (row) {
    const { key: _key, ...rest } = row;
    return rest;
  }
  return defaultSettings();
}

export async function saveSettings(patch: Partial<Settings>) {
  const current = await getSettings();
  await db.settings.put({ ...current, ...patch, key: "main" });
}

export interface NewAccount {
  name: string;
  type: AccountType;
  color: string;
  initials?: string;
  balanceCentavos: number;
}

export async function addAccount(input: NewAccount, now = Date.now()): Promise<Account> {
  const account: Account = {
    id: uid(),
    name: input.name.trim(),
    type: input.type,
    isLiability: isLiabilityType(input.type),
    color: input.color,
    initials: input.initials ?? makeInitials(input.name),
    createdAt: now,
  };
  await db.transaction("rw", db.accounts, db.entries, async () => {
    await db.accounts.add(account);
    await db.entries.add({
      id: uid(),
      accountId: account.id,
      balanceCentavos: input.balanceCentavos,
      recordedAt: now,
    });
  });
  return account;
}

export async function addAccounts(inputs: NewAccount[], now = Date.now()) {
  for (const input of inputs) await addAccount(input, now);
}

export async function recordBalance(
  accountId: string,
  balanceCentavos: number,
  note?: string,
  now = Date.now(),
) {
  await db.entries.add({
    id: uid(),
    accountId,
    balanceCentavos,
    note: note?.trim() || undefined,
    recordedAt: now,
  });
}

export async function updateAccount(
  id: string,
  patch: Partial<Pick<Account, "name" | "type" | "color">>,
) {
  const next: Partial<Account> = { ...patch };
  if (patch.name !== undefined) next.initials = makeInitials(patch.name);
  if (patch.type !== undefined) next.isLiability = isLiabilityType(patch.type);
  await db.accounts.update(id, next);
}

/** keepHistory archives the account so past entries stay; otherwise everything is removed. */
export async function deleteAccount(id: string, keepHistory: boolean, now = Date.now()) {
  await db.transaction("rw", db.accounts, db.entries, db.expenses, async () => {
    if (keepHistory) {
      await db.accounts.update(id, { archivedAt: now });
    } else {
      await db.entries.where("accountId").equals(id).delete();
      await db.expenses.where("accountId").equals(id).delete();
      await db.accounts.delete(id);
    }
  });
}

export async function loadSnapshot(): Promise<Snapshot> {
  const [accounts, entries, expenses] = await Promise.all([
    db.accounts.toArray(),
    db.entries.toArray(),
    db.expenses.toArray(),
  ]);
  return { accounts, entries, expenses };
}

/** Replaces accounts and entries. Settings are merged but the PIN is never imported. */
export async function replaceAll(snapshot: Snapshot, settings?: Partial<Settings>) {
  await db.transaction("rw", db.accounts, db.entries, db.expenses, async () => {
    await db.accounts.clear();
    await db.entries.clear();
    await db.expenses.clear();
    await db.accounts.bulkAdd(snapshot.accounts);
    await db.entries.bulkAdd(snapshot.entries);
    await db.expenses.bulkAdd(snapshot.expenses ?? []);
  });
  const { pinHash: _p, ...safe } = settings ?? {};
  await saveSettings({ ...safe, onboarded: snapshot.accounts.length > 0 });
}

export async function resetAll() {
  await db.transaction("rw", db.accounts, db.entries, db.expenses, db.settings, async () => {
    await db.accounts.clear();
    await db.entries.clear();
    await db.expenses.clear();
    await db.settings.clear();
  });
}

export interface NewExpense {
  accountId: string;
  amountCentavos: number;
  category: string;
  note?: string;
}

async function latestBalance(accountId: string) {
  const list = await db.entries.where("accountId").equals(accountId).sortBy("recordedAt");
  return list[list.length - 1];
}

/**
 * Logs an expense and moves the account balance with it: assets go down, credit cards and
 * loans go up (more owed). The balance change is a normal history entry, so net worth,
 * history and charts all pick it up.
 */
export async function recordExpense(input: NewExpense, now = Date.now()): Promise<Expense> {
  return db.transaction("rw", db.accounts, db.entries, db.expenses, async () => {
    const account = await db.accounts.get(input.accountId);
    if (!account || account.archivedAt !== undefined) throw new Error("Account not found");
    const last = await latestBalance(account.id);
    const next = applyExpense(account.isLiability, last?.balanceCentavos ?? 0, input.amountCentavos);
    const expense: Expense = {
      id: uid(),
      accountId: account.id,
      amountCentavos: input.amountCentavos,
      category: input.category,
      note: input.note?.trim() || undefined,
      recordedAt: now,
    };
    const label = categoryLabel(expense.category);
    await db.entries.add({
      id: uid(),
      accountId: account.id,
      balanceCentavos: next,
      note: expense.note ? `${label}: ${expense.note}` : label,
      recordedAt: last && last.recordedAt >= now ? last.recordedAt + 1 : now,
      expenseId: expense.id,
    });
    await db.expenses.add(expense);
    return expense;
  });
}

/** Removes an expense and puts the money back (history keeps both entries). */
export async function deleteExpense(id: string, now = Date.now()) {
  await db.transaction("rw", db.accounts, db.entries, db.expenses, async () => {
    const expense = await db.expenses.get(id);
    if (!expense) return;
    const account = await db.accounts.get(expense.accountId);
    if (account && account.archivedAt === undefined) {
      const last = await latestBalance(account.id);
      const restored = applyExpense(!account.isLiability, last?.balanceCentavos ?? 0, expense.amountCentavos);
      await db.entries.add({
        id: uid(),
        accountId: account.id,
        balanceCentavos: restored,
        note: `Expense removed (${categoryLabel(expense.category)})`,
        recordedAt: last && last.recordedAt >= now ? last.recordedAt + 1 : now,
      });
    }
    await db.expenses.delete(id);
  });
}
