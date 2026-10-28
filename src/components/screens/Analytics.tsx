"use client";

import { useMemo } from "react";
import { formatPHP } from "@/lib/money";
import { useData } from "../DataProvider";
import Money from "../Money";
import Ring, { type Slice } from "../Ring";
import { Empty, Rise, ScreenTitle } from "../ui";

export default function Analytics() {
  const { accounts, balances, totals, settings } = useData();

  const slices = useMemo<Slice[]>(
    () =>
      accounts
        .filter((a) => !a.isLiability && (balances.get(a.id) ?? 0) > 0)
        .map((a) => ({
          id: a.id,
          name: a.name,
          initials: a.initials,
          value: balances.get(a.id)!,
          color: a.color,
        }))
        .sort((a, b) => b.value - a.value),
    [accounts, balances],
  );
  const sliceTotal = slices.reduce((s, x) => s + x.value, 0);
  const ratio = totals.assets + totals.liabilities > 0 ? totals.assets / (totals.assets + totals.liabilities) : 1;

  if (accounts.length === 0) {
    return (
      <div>
        <ScreenTitle>Analytics</ScreenTitle>
        <Empty title="Nothing to chart yet" body="Add an account and your charts will show up here." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenTitle>Analytics</ScreenTitle>

      <Rise>
        <section className="rounded-[28px] bg-card p-5" aria-label="Where your money is">
          <h2 className="mb-3 text-lg font-extrabold">Where your money is</h2>
          {slices.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              No positive balances to show. Update an account to see the split.
            </p>
          ) : (
            <>
              <Ring slices={slices} centerLabel="Net worth" centerValue={totals.net} />
              <ul className="mt-4 flex flex-col gap-2">
                {slices.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 truncate font-semibold">{s.name}</span>
                    <span className="num text-muted">{((s.value / sliceTotal) * 100).toFixed(1)}%</span>
                    <span className="num w-28 text-right font-bold">
                      {settings.hideBalances ? "••••" : formatPHP(s.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </Rise>

      <Rise i={1}>
        <section className="rounded-[28px] bg-card p-5" aria-label="Assets versus liabilities">
          <h2 className="mb-3 text-lg font-extrabold">Assets vs Liabilities</h2>
          <div className="h-3 overflow-hidden rounded-full bg-down/60" role="img" aria-label={`${Math.round(ratio * 100)}% assets`}>
            <div className="h-full origin-left rounded-full bg-up" style={{ width: `${ratio * 100}%` }} />
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="h-2.5 w-2.5 rounded-full bg-up" /> Assets
              </dt>
              <dd>
                <Money centavos={totals.assets} className="text-lg font-extrabold" />
              </dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted">
                <span className="h-2.5 w-2.5 rounded-full bg-down" /> Liabilities
              </dt>
              <dd>
                <Money centavos={totals.liabilities} className="text-lg font-extrabold" />
              </dd>
            </div>
          </dl>
        </section>
      </Rise>

    </div>
  );
}
