export const ACCOUNT_TYPES = [
  "Bank",
  "E-wallet",
  "Cash",
  "Investment",
  "Credit card",
  "Loan",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const LIABILITY_TYPES: AccountType[] = ["Credit card", "Loan"];
export const isLiabilityType = (t: AccountType) => LIABILITY_TYPES.includes(t);

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  isLiability: boolean;
  color: string;
  initials: string;
  createdAt: number;
  archivedAt?: number;
}

/** Balance is integer centavos. For liabilities it is the amount owed (positive = debt). */
export interface BalanceEntry {
  id: string;
  accountId: string;
  balanceCentavos: number;
  note?: string;
  recordedAt: number;
  /** set when this balance change came from logging an expense */
  expenseId?: string;
}

export interface Expense {
  id: string;
  accountId: string;
  /** positive integer centavos */
  amountCentavos: number;
  category: string;
  note?: string;
  recordedAt: number;
}

export type ThemePref = "system" | "light" | "dark";

export interface Settings {
  hideBalances: boolean;
  theme: ThemePref;
  pinHash?: string;
  lastExportAt?: number;
  onboarded: boolean;
  createdAt: number;
}

export const defaultSettings = (): Settings => ({
  hideBalances: false,
  theme: "system",
  onboarded: false,
  createdAt: Date.now(),
});

export interface Snapshot {
  accounts: Account[];
  entries: BalanceEntry[];
  expenses?: Expense[];
}
