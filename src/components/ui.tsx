"use client";

import { motion } from "framer-motion";
import { Banknote } from "lucide-react";
import { logoForName } from "@/lib/presets";
import type { Account } from "@/lib/types";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Mixes a #rrggbb color toward white (t > 0) or black (t < 0). */
export function shade(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const target = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const ch = (v: number) => Math.round(v + (target - v) * k);
  return `rgb(${ch((n >> 16) & 255)}, ${ch((n >> 8) & 255)}, ${ch(n & 255)})`;
}

/** Bank logo tile when we have one for the name, otherwise a gradient monogram badge. */
export function Avatar({
  account,
  size = 44,
}: {
  account: Pick<Account, "color" | "initials"> & { type?: Account["type"]; name?: string; logo?: string };
  size?: number;
}) {
  const len = account.initials.length;
  const cash = account.type === "Cash";
  const logo = account.logo ?? (account.name ? logoForName(account.name) : undefined);
  if (logo) {
    return (
      <span
        aria-hidden
        className="relative inline-block shrink-0 overflow-hidden rounded-full bg-white"
        style={{
          width: size,
          height: size,
          boxShadow: "0 6px 14px -4px rgba(0,0,0,0.45), inset 0 0 0 1.5px rgba(255,255,255,0.35)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt="" width={size} height={size} draggable={false} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-extrabold text-white"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${shade(account.color, 0.28)} 0%, ${account.color} 52%, ${shade(account.color, -0.3)} 100%)`,
        fontSize: size * (len > 2 ? 0.3 : 0.4),
        letterSpacing: "-0.02em",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
        boxShadow: `0 6px 14px -4px ${shade(account.color, -0.35)}, inset 0 0 0 1.5px rgba(255,255,255,0.3)`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 20% 0%, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%)",
        }}
      />
      <span className="relative">
        {cash ? <Banknote size={size * 0.5} strokeWidth={2.4} /> : account.initials}
      </span>
    </span>
  );
}

export function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold ${className}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`pressable btn-glow min-h-[54px] w-full rounded-[20px] px-5 text-base font-extrabold text-white disabled:opacity-40 disabled:shadow-none ${className}`}
    />
  );
}

export function SecondaryButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`pressable min-h-[48px] w-full rounded-2xl bg-sheet-field px-5 text-base font-bold text-sheet-fg disabled:opacity-40 ${className}`}
    />
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl bg-card px-6 py-10 text-center">
      <p className="text-lg font-extrabold">{title}</p>
      <p className="max-w-[28ch] text-sm text-muted">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <h1 className="px-1 pb-4 pt-2 text-2xl font-extrabold tracking-tight">{children}</h1>;
}

/** Short staggered entrance (transform + opacity only). */
export function Rise({
  i = 0,
  className = "",
  children,
}: {
  i?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
