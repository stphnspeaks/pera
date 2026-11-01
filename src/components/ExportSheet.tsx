"use client";

import { useState } from "react";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { loadSnapshot, saveSettings } from "@/lib/db";
import { buildExport, exportFileName, toCsv, toJson } from "@/lib/export";
import { saveTextFile } from "@/lib/share";
import { useData } from "./DataProvider";
import Sheet from "./Sheet";
import { useUI } from "./ui-context";

export default function ExportSheet({ open }: { open: boolean }) {
  const { closeSheet, showToast } = useUI();
  const { settings } = useData();
  const [busy, setBusy] = useState(false);

  async function run(kind: "json" | "csv") {
    setBusy(true);
    try {
      const snap = await loadSnapshot();
      if (kind === "json") {
        await saveTextFile(
          exportFileName("json"),
          toJson(buildExport(snap, settings)),
          "application/json",
        );
      } else {
        await saveTextFile(exportFileName("csv"), toCsv(snap), "text/csv");
      }
      await saveSettings({ lastExportAt: Date.now() });
      showToast("Backup saved");
      closeSheet();
    } catch (e) {
      if ((e as DOMException)?.name !== "AbortError") showToast("Couldn't export. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={closeSheet} title="Export your data">
      <p className="mb-4 text-sm text-sheet-muted">
        Your data lives only on this device. Save a copy somewhere safe (Files, iCloud Drive, Google Drive).
      </p>
      <div className="flex flex-col gap-3 pb-2">
        <Option
          icon={<FileJson />}
          title="JSON backup"
          body="Full backup you can import back later."
          disabled={busy}
          onClick={() => run("json")}
        />
        <Option
          icon={<FileSpreadsheet />}
          title="CSV spreadsheet"
          body="Every balance update, for Excel or Sheets."
          disabled={busy}
          onClick={() => run("csv")}
        />
      </div>
    </Sheet>
  );
}

function Option({
  icon,
  title,
  body,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="pressable flex min-h-[64px] items-center gap-4 rounded-2xl bg-sheet-field p-4 text-left disabled:opacity-50"
    >
      <span className="text-brand">{icon}</span>
      <span>
        <span className="block font-extrabold">{title}</span>
        <span className="block text-sm text-sheet-muted">{body}</span>
      </span>
    </button>
  );
}
