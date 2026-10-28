import { centavosToPlain, parseCentavos } from "./money";
import {
  ACCOUNT_TYPES,
  isLiabilityType,
  type Account,
  type BalanceEntry,
  type Expense,
  type Settings,
  type Snapshot,
} from "./types";

export const EXPORT_VERSION = 1;

export interface ExportFile extends Snapshot {
  app: "pera";
  version: number;
  exportedAt: number;
  settings?: Partial<Settings>;
}

export function buildExport(snapshot: Snapshot, settings?: Settings, now = Date.now()): ExportFile {
  const safe = settings
    ? { hideBalances: settings.hideBalances, theme: settings.theme, lastExportAt: now }
    : undefined;
  return { app: "pera", version: EXPORT_VERSION, exportedAt: now, ...snapshot, settings: safe };
}

export const toJson = (file: ExportFile) => JSON.stringify(file, null, 2);

export class ImportError extends Error {}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === "string";

export function parseImport(text: string): ExportFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new ImportError("That file is not valid JSON. Pick a backup exported from this app.");
  }
  const o = raw as Partial<ExportFile> | null;
  if (!o || o.app !== "pera" || !Array.isArray(o.accounts) || !Array.isArray(o.entries)) {
    throw new ImportError("This doesn't look like a backup from this app.");
  }
  if (isNum(o.version) && o.version > EXPORT_VERSION) {
    throw new ImportError("This backup is from a newer version of the app.");
  }
  const accounts: Account[] = o.accounts.map((a, i) => {
    if (
      !a ||
      !isStr(a.id) ||
      !isStr(a.name) ||
      !ACCOUNT_TYPES.includes(a.type) ||
      !isStr(a.color) ||
      !isStr(a.initials) ||
      !isNum(a.createdAt)
    ) {
      throw new ImportError(`Account #${i + 1} in the backup is damaged.`);
    }
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      isLiability: isLiabilityType(a.type),
      color: a.color,
      initials: a.initials,
      createdAt: a.createdAt,
      ...(isNum(a.archivedAt) ? { archivedAt: a.archivedAt } : {}),
    };
  });
  const ids = new Set(accounts.map((a) => a.id));
  const entries: BalanceEntry[] = o.entries.map((e, i) => {
    if (
      !e ||
      !isStr(e.id) ||
      !isStr(e.accountId) ||
      !ids.has(e.accountId) ||
      !Number.isSafeInteger(e.balanceCentavos) ||
      !isNum(e.recordedAt)
    ) {
      throw new ImportError(`History entry #${i + 1} in the backup is damaged.`);
    }
    return {
      id: e.id,
      accountId: e.accountId,
      balanceCentavos: e.balanceCentavos,
      recordedAt: e.recordedAt,
      ...(isStr(e.note) && e.note ? { note: e.note } : {}),
      ...(isStr(e.expenseId) ? { expenseId: e.expenseId } : {}),
    };
  });
  const rawExpenses: unknown[] = Array.isArray(o.expenses) ? o.expenses : [];
  const expenses: Expense[] = rawExpenses.map((x, i) => {
    const e = x as Partial<Expense> | null;
    if (
      !e ||
      !isStr(e.id) ||
      !isStr(e.accountId) ||
      !ids.has(e.accountId) ||
      !Number.isSafeInteger(e.amountCentavos) ||
      (e.amountCentavos as number) <= 0 ||
      !isStr(e.category) ||
      !isNum(e.recordedAt)
    ) {
      throw new ImportError(`Expense #${i + 1} in the backup is damaged.`);
    }
    return {
      id: e.id,
      accountId: e.accountId,
      amountCentavos: e.amountCentavos as number,
      category: e.category,
      recordedAt: e.recordedAt,
      ...(isStr(e.note) && e.note ? { note: e.note } : {}),
    };
  });
  return {
    app: "pera",
    version: o.version ?? 1,
    exportedAt: o.exportedAt ?? 0,
    accounts,
    entries,
    expenses,
    settings: o.settings,
  };
}

/* ---------- CSV ---------- */

export const CSV_HEADER = [
  "account_id",
  "account",
  "type",
  "archived",
  "recorded_at",
  "balance_php",
  "note",
] as const;

const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(snapshot: Snapshot): string {
  const byId = new Map(snapshot.accounts.map((a) => [a.id, a]));
  const rows = [...snapshot.entries]
    .sort((a, b) => a.recordedAt - b.recordedAt)
    .map((e) => {
      const a = byId.get(e.accountId);
      return [
        e.accountId,
        a?.name ?? "",
        a?.type ?? "",
        a?.archivedAt ? "yes" : "no",
        new Date(e.recordedAt).toISOString(),
        centavosToPlain(e.balanceCentavos),
        e.note ?? "",
      ]
        .map(esc)
        .join(",");
    });
  return [CSV_HEADER.join(","), ...rows].join("\r\n");
}

export function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      cur = "";
      rows.push(row);
      row = [];
    } else cur += c;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

/** Rebuilds accounts and entries from a CSV made by toCsv (colors are regenerated). */
export function fromCsv(
  text: string,
  colorFor: (name: string) => string,
  initialsFor: (name: string) => string,
): Snapshot {
  const [head, ...rows] = parseCsvRows(text).filter((r) => r.length > 1);
  if (!head || head.join(",") !== CSV_HEADER.join(",")) {
    throw new ImportError("This CSV wasn't exported from this app.");
  }
  const accounts = new Map<string, Account>();
  const entries: BalanceEntry[] = [];
  rows.forEach((r, i) => {
    const [id, name, type, archived, at, balance, note] = r;
    const centavos = parseCentavos(balance.replace(/^-/, ""));
    const t = Date.parse(at);
    if (centavos === null || Number.isNaN(t) || !ACCOUNT_TYPES.includes(type as Account["type"])) {
      throw new ImportError(`CSV row ${i + 2} is damaged.`);
    }
    const signed = balance.startsWith("-") ? -centavos : centavos;
    if (!accounts.has(id)) {
      const ty = type as Account["type"];
      accounts.set(id, {
        id,
        name,
        type: ty,
        isLiability: isLiabilityType(ty),
        color: colorFor(name),
        initials: initialsFor(name),
        createdAt: t,
        ...(archived === "yes" ? { archivedAt: t } : {}),
      });
    }
    entries.push({
      id: `${id}-${t}-${i}`,
      accountId: id,
      balanceCentavos: signed,
      recordedAt: t,
      ...(note ? { note } : {}),
    });
  });
  return { accounts: [...accounts.values()], entries };
}

export const exportFileName = (ext: "json" | "csv", now = Date.now()) =>
  `pera-backup-${new Date(now).toISOString().slice(0, 10)}.${ext}`;
