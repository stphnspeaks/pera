"use client";

import { ChevronRight } from "lucide-react";
import { useData } from "../DataProvider";
import Money from "../Money";
import { Avatar, Empty, PrimaryButton, Rise, ScreenTitle } from "../ui";
import { useUI } from "../ui-context";
import type { Account } from "@/lib/types";

export default function Accounts() {
  const { accounts, balances, totals } = useData();
  const { openSheet } = useUI();
  const assets = accounts.filter((a) => !a.isLiability);
  const liabilities = accounts.filter((a) => a.isLiability);

  return (
    <div>
      <ScreenTitle>Accounts</ScreenTitle>
      {accounts.length === 0 ? (
        <Empty
          title="No accounts yet"
          body="Add your banks, e-wallets and cash to see your total net worth."
          action={
            <PrimaryButton onClick={() => openSheet({ kind: "add" })} className="!px-8">
              Add account
            </PrimaryButton>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Group title="Assets" total={totals.assets} list={assets} balances={balances} i={0} />
          {liabilities.length > 0 && (
            <Group title="Liabilities" total={totals.liabilities} list={liabilities} balances={balances} i={1} />
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  title,
  total,
  list,
  balances,
  i,
}: {
  title: string;
  total: number;
  list: Account[];
  balances: Map<string, number>;
  i: number;
}) {
  const { openSheet } = useUI();
  return (
    <Rise i={i}>
      <section className="rounded-[28px] bg-card p-5" aria-label={title}>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">{title}</h2>
          <Money centavos={total} className="text-sm font-bold text-muted" />
        </div>
        {list.length === 0 ? (
          <p className="py-2 text-sm text-muted">Nothing here yet.</p>
        ) : (
          <ul>
            {list.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => openSheet({ kind: "balance", accountId: a.id })}
                  className="pressable my-1 flex min-h-[68px] w-full items-center gap-3 rounded-3xl px-2 py-1 text-left"
                  style={{ background: `linear-gradient(90deg, ${a.color}40, ${a.color}00 75%)` }}
                >
                  <Avatar account={a} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{a.name}</span>
                    <span className="block text-xs text-muted">{a.type}</span>
                  </span>
                  <Money centavos={balances.get(a.id) ?? 0} className="font-extrabold" />
                  <ChevronRight size={18} className="opacity-60" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Rise>
  );
}
