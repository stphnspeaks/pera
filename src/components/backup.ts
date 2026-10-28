import type { Settings } from "@/lib/types";

export const BACKUP_DAYS = 30;
const DAY = 86_400_000;

/** True when it has been more than 30 days since the last export (or since setup). */
export function backupDue(settings: Settings, now = Date.now()): boolean {
  if (!settings.onboarded) return false;
  const since = settings.lastExportAt ?? settings.createdAt;
  return since > 0 && now - since > BACKUP_DAYS * DAY;
}
