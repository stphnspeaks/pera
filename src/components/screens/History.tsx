"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { historyRows } from "@/lib/networth";
import { useData } from "../DataProvider";
import Money from "../Money";
import { Avatar, Empty, Rise, ScreenTitle } from "../ui";
import { useUI } from "../ui-context";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default function History() {
  const { allAccounts, entries } = useData();
  const { historyFilter, setHistoryFilter } = useUI();

  const rows = useMemo(() => historyRows(allAccounts, entries), [allAccounts, entries]);
  const shown = historyFilter ? rows.filter((r) => r.entry.accountId === historyFilter) : rows;
  const filterOptions = allAccounts.filter((a) => entries.some((e) => e.accountId === a.id));

  return (
    <div>
      <ScreenTitle>History</ScreenTitle>
      {rows.length === 0 ? (
        <Empty title="No history yet" body="Every time you update a balance, it shows up here." />
      ) : (
        <>
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by account">
            <FilterPill active={!historyFilter} onClick={() => setHistoryFilter(null)}>
              All
            </FilterPill>
            {filterOptions.map((a) => (
              <FilterPill key={a.id} active={historyFilter === a.id} onClick={() => setHistoryFilter(a.id)}>
                {a.name}
                {a.archivedAt ? " (removed)" : ""}
              </FilterPill>
            ))}
          </div>
          {shown.length === 0 ? (
            <Empty title="Nothing for this account" body="Try another filter." />
          ) : (
            <ul className="flex flex-col gap-4">
              {shown.slice(0, 200).map((r, i) => {
                const { entry, account, previous, delta } = r;
                const liability = account?.isLiability ?? false;
                const good = liability ? delta < 0 : delta > 0;
                const color = delta === 0 ? "text-muted" : good ? "text-up" : "text-down";
                return (
                  <li key={entry.id}>
                    <Rise i={Math.min(i, 6)}>
                      <div className="flex items-end">
                        <span className="rounded-t-2xl bg-card2 px-4 pb-1.5 pt-2 text-xs font-extrabold">
                          {previous === null ? "Added" : entry.expenseId ? "Expense" : "Updated"}
                        </span>
                        <span className="px-3 pb-1.5 text-xs text-muted">{dateFmt.format(entry.recordedAt)}</span>
                      </div>
                      <div className="rounded-b-3xl rounded-tr-3xl bg-card2 p-4">
                        <div className="flex items-center gap-3">
                          {account && <Avatar account={account} size={40} />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{account?.name ?? "Deleted account"}</p>
                            <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                              {previous !== null && (
                                <>
                                  <Money centavos={previous} decimalClassName="opacity-70" />
                                  <ArrowRight size={12} aria-label="to" />
                                </>
                              )}
                              <Money centavos={entry.balanceCentavos} className="font-bold text-white" />
                            </p>
                          </div>
                          <Money centavos={delta} signed className={`text-sm font-extrabold ${color}`} />
                        </div>
                        {entry.note && <p className="mt-2 text-sm text-muted">“{entry.note}”</p>}
                      </div>
                    </Rise>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`pressable min-h-[44px] shrink-0 rounded-full px-4 text-sm font-bold ${
        active ? "bg-white text-[#1d4ed8]" : "bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}
