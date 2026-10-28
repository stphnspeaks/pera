"use client";

import { useData } from "./DataProvider";
import Money from "./Money";
import Sheet from "./Sheet";
import { Avatar } from "./ui";
import { useUI } from "./ui-context";

/** Chooses which account to update (used by the Home "Update Balance" shortcut). */
export default function PickSheet({ open }: { open: boolean }) {
  const { closeSheet, openSheet } = useUI();
  const { accounts, balances } = useData();
  return (
    <Sheet open={open} onClose={closeSheet} title="Update which account?">
      {accounts.length === 0 ? (
        <p className="pb-4 text-sm text-sheet-muted">You have no accounts yet. Add one first.</p>
      ) : (
        <ul className="pb-2">
          {accounts.map((a) => (
            <li key={a.id}>
              <button
                onClick={() => openSheet({ kind: "balance", accountId: a.id })}
                className="pressable flex min-h-[60px] w-full items-center gap-3 rounded-2xl text-left"
              >
                <Avatar account={a} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{a.name}</span>
                  <span className="block text-xs text-sheet-muted">{a.type}</span>
                </span>
                <Money centavos={balances.get(a.id) ?? 0} className="font-bold" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
