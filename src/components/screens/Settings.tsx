"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { Download, KeyRound, ShieldCheck, Trash2, Upload } from "lucide-react";
import config from "@config";
import { replaceAll, resetAll, saveSettings } from "@/lib/db";
import { ImportError, parseImport, type ExportFile } from "@/lib/export";
import { hashPin, isValidPin, verifyPin } from "@/lib/pin";
import type { ThemePref } from "@/lib/types";
import { useData } from "../DataProvider";
import Sheet from "../Sheet";
import { PrimaryButton, Rise, ScreenTitle, SecondaryButton } from "../ui";
import { useUI } from "../ui-context";
import { backupDue } from "../backup";

const dayFmt = new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" });

export default function Settings() {
  const { settings } = useData();
  const { openSheet, showToast, setTab } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pinOpen, setPinOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [pending, setPending] = useState<ExportFile | null>(null);
  const [importError, setImportError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    setImportError("");
    try {
      setPending(parseImport(await file.text()));
    } catch (e) {
      setImportError(e instanceof ImportError ? e.message : "We couldn't read that file.");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function confirmImport() {
    if (!pending) return;
    try {
      await replaceAll(
        { accounts: pending.accounts, entries: pending.entries },
        { hideBalances: pending.settings?.hideBalances, theme: pending.settings?.theme },
      );
      showToast("Backup imported");
      setPending(null);
      setTab("home");
    } catch {
      setImportError("Importing failed. Your current data was not changed.");
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenTitle>Settings</ScreenTitle>

      <Rise>
        <div className="flex gap-3 rounded-[28px] bg-white/15 p-4">
          <ShieldCheck className="mt-0.5 shrink-0" />
          <p className="text-sm">
            <span className="font-extrabold">Your data stays on this device.</span> {config.name} has no
            account, no server and no tracking. Back up regularly, because clearing the browser or
            deleting the app removes your data.
          </p>
        </div>
      </Rise>

      <Rise i={1}>
        <Card title="Appearance">
          <div className="flex rounded-2xl bg-white/10 p-1" role="radiogroup" aria-label="Theme">
            {(["system", "light", "dark"] as ThemePref[]).map((t) => (
              <button
                key={t}
                role="radio"
                aria-checked={settings.theme === t}
                onClick={() => saveSettings({ theme: t })}
                className={`pressable min-h-[44px] flex-1 rounded-xl text-sm font-bold capitalize ${
                  settings.theme === t ? "bg-white text-[#1d4ed8]" : ""
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>
      </Rise>

      <Rise i={2}>
        <Card title="Privacy">
          <Toggle
            label="Hide balances"
            hint="Shows •••• instead of amounts"
            checked={settings.hideBalances}
            onChange={(v) => saveSettings({ hideBalances: v })}
          />
          <Row
            icon={<KeyRound size={20} />}
            title={settings.pinHash ? "PIN lock is on" : "PIN lock"}
            hint={
              settings.pinHash
                ? "Change or remove your PIN"
                : "Ask for a 4–6 digit PIN when opening the app"
            }
            onClick={() => setPinOpen(true)}
          />
          <p className="px-1 text-xs text-muted">
            Face ID isn&apos;t available to web apps, so the lock uses a PIN. It keeps casual snoopers out of
            the app; it does not encrypt the data stored on your phone.
          </p>
        </Card>
      </Rise>

      <Rise i={3}>
        <Card title="Your data">
          <Row
            icon={<Download size={20} />}
            title="Export backup"
            hint={
              settings.lastExportAt
                ? `Last backup: ${dayFmt.format(settings.lastExportAt)}`
                : "You haven't exported yet"
            }
            warn={backupDue(settings)}
            onClick={() => openSheet({ kind: "export" })}
          />
          <Row
            icon={<Upload size={20} />}
            title="Import from JSON"
            hint="Replaces everything with a backup file"
            onClick={() => fileRef.current?.click()}
          />
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Choose backup file"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          {importError && (
            <p role="alert" className="rounded-2xl bg-red-100 p-3 text-sm font-semibold text-red-800">
              {importError}
            </p>
          )}
          <Row
            icon={<Trash2 size={20} />}
            title="Reset all data"
            hint="Deletes every account and all history"
            danger
            onClick={() => setResetOpen(true)}
          />
        </Card>
      </Rise>

      <p className="pb-2 text-center text-xs text-muted">{config.name} · stored locally · works offline</p>

      <PinSheet open={pinOpen} onClose={() => setPinOpen(false)} />

      <Sheet open={!!pending} onClose={() => setPending(null)} title="Replace your data?">
        <p className="mb-4 text-sm text-sheet-muted">
          This backup has {pending?.accounts.length} accounts and {pending?.entries.length} history entries.
          Importing will <b>replace everything currently in the app</b>. Consider exporting first.
        </p>
        <div className="flex flex-col gap-2 pb-2">
          <PrimaryButton onClick={confirmImport}>Replace with backup</PrimaryButton>
          <SecondaryButton onClick={() => setPending(null)}>Cancel</SecondaryButton>
        </div>
      </Sheet>

      <Sheet open={resetOpen} onClose={() => setResetOpen(false)} title="Reset all data?">
        <p className="mb-4 text-sm text-sheet-muted">
          Every account, balance and history entry will be permanently deleted from this device. This can&apos;t
          be undone unless you have a backup.
        </p>
        <div className="flex flex-col gap-2 pb-2">
          <button
            onClick={async () => {
              await resetAll();
              try {
                localStorage.removeItem("pera-theme");
              } catch {}
              setResetOpen(false);
              setTab("home");
            }}
            className="pressable min-h-[48px] rounded-2xl bg-red-500 px-5 font-bold text-white"
          >
            Yes, delete everything
          </button>
          <SecondaryButton onClick={() => setResetOpen(false)}>Cancel</SecondaryButton>
        </div>
      </Sheet>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-[28px] bg-card p-5" aria-label={title}>
      <h2 className="text-lg font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="pressable flex min-h-[56px] w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block font-bold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? "bg-up" : "bg-white/25"}`}
      >
        <span
          className="h-6 w-6 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(24px)" : "translateX(0)" }}
        />
      </span>
    </button>
  );
}

function Row({
  icon,
  title,
  hint,
  onClick,
  danger,
  warn,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
  danger?: boolean;
  warn?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="pressable flex min-h-[56px] w-full items-center gap-3 text-left"
    >
      <span className={danger ? "text-down" : warn ? "text-amber-300" : "text-accent"}>{icon}</span>
      <span className="flex-1">
        <span className={`block font-bold ${danger ? "text-down" : ""}`}>{title}</span>
        <span className={`block text-xs ${warn ? "font-bold text-amber-300" : "text-muted"}`}>
          {warn ? `${hint} · backup overdue` : hint}
        </span>
      </span>
    </button>
  );
}

function PinSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useData();
  const { showToast } = useUI();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ids = [useId(), useId(), useId()];
  const has = !!settings.pinHash;

  const reset = () => {
    setCurrent("");
    setNext("");
    setAgain("");
    setError("");
  };
  const close = () => {
    reset();
    onClose();
  };
  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

  async function checkCurrent() {
    if (!has) return true;
    if (!(await verifyPin(current, settings.pinHash!))) {
      setError("Your current PIN is incorrect.");
      return false;
    }
    return true;
  }

  async function save() {
    setError("");
    if (!isValidPin(next)) return setError("Use 4 to 6 digits.");
    if (next !== again) return setError("The two PINs don't match.");
    setBusy(true);
    try {
      if (!(await checkCurrent())) return;
      await saveSettings({ pinHash: await hashPin(next) });
      showToast("PIN saved");
      close();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setError("");
    setBusy(true);
    try {
      if (!(await checkCurrent())) return;
      await saveSettings({ pinHash: undefined });
      showToast("PIN removed");
      close();
    } finally {
      setBusy(false);
    }
  }

  const field = (id: string, label: string, v: string, set: (s: string) => void) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold text-sheet-muted">
        {label}
      </label>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={v}
        onChange={(e) => set(digits(e.target.value))}
        className="num min-h-[48px] w-full rounded-2xl bg-sheet-field px-4 text-lg font-bold tracking-widest outline-none"
      />
    </div>
  );

  return (
    <Sheet open={open} onClose={close} title={has ? "Change or remove PIN" : "Set a PIN"}>
      <form
        className="flex flex-col gap-4 pb-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        {has && field(ids[0], "Current PIN", current, setCurrent)}
        {field(ids[1], "New PIN (4–6 digits)", next, setNext)}
        {field(ids[2], "Repeat new PIN", again, setAgain)}
        {error && (
          <p role="alert" className="text-sm font-semibold text-red-500">
            {error}
          </p>
        )}
        <PrimaryButton type="submit" disabled={busy || !next || (has && !current)}>
          {has ? "Change PIN" : "Turn on PIN lock"}
        </PrimaryButton>
        {has && (
          <button
            type="button"
            onClick={remove}
            disabled={busy || !current}
            className="pressable min-h-[48px] rounded-2xl bg-red-500/15 font-bold text-red-500 disabled:opacity-40"
          >
            Remove PIN (enter current PIN above)
          </button>
        )}
      </form>
    </Sheet>
  );
}
