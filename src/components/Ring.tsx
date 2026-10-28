"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { MASK, formatPHP } from "@/lib/money";
import { useData } from "./DataProvider";

export interface Slice {
  id: string;
  name: string;
  initials: string;
  value: number; // centavos, > 0
  color: string;
}

const C = 150;
const R = 100;
const STROKE = 46;
const FS = 12;
const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (r: number, deg: number) => ({
  x: C + r * Math.sin(rad(deg)),
  y: C - r * Math.cos(rad(deg)),
});

function arcPath(r: number, from: number, to: number, reverse: boolean) {
  const a = pt(r, reverse ? to : from);
  const b = pt(r, reverse ? from : to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} ${reverse ? 0 : 1} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

export default function Ring({ slices, centerLabel, centerValue }: {
  slices: Slice[];
  centerLabel: string;
  centerValue: number;
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const { settings } = useData();
  const hidden = settings.hideBalances;
  const total = slices.reduce((s, x) => s + x.value, 0);
  const gap = slices.length > 1 ? 2 : 0;

  let cursor = 0;
  const arcs = slices.map((s) => {
    const sweep = (s.value / total) * 360;
    const from = cursor + gap / 2;
    const to = Math.min(cursor + sweep - gap / 2, cursor + 359.9);
    cursor += sweep;
    const mid = (from + to) / 2;
    const bottom = Math.cos(rad(mid)) < 0;
    const labelR = bottom ? R + FS * 0.35 : R - FS * 0.35;
    const length = labelR * rad(to - from) - 8;
    const label =
      s.name.length * FS * 0.62 <= length
        ? s.name
        : s.initials.length * FS * 0.62 <= length
          ? s.initials
          : "";
    return { s, from, to, bottom, labelR, label };
  });

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[320px]">
      <svg viewBox="0 0 300 300" className="h-full w-full" role="img" aria-label="Net worth split by account">
        <defs>
          <mask id={`${uid}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="300">
            <motion.circle
              cx={C}
              cy={C}
              r={R}
              fill="none"
              stroke="#fff"
              strokeWidth={STROKE + 8}
              transform={`rotate(-90 ${C} ${C})`}
              initial={{ pathLength: reduce ? 1 : 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 1, ease: [0.22, 1, 0.36, 1] }}
            />
          </mask>
        </defs>
        <g mask={`url(#${uid}-m)`}>
          {arcs.map(({ s, from, to, bottom, labelR, label }) => (
            <g key={s.id}>
              <path
                d={arcPath(R, from, to, false)}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />
              {label && (
                <>
                  <path id={`${uid}-${s.id}`} d={arcPath(labelR, from, to, bottom)} fill="none" />
                  <text fill="#fff" fontSize={FS} fontWeight={800} letterSpacing="0.2">
                    <textPath href={`#${uid}-${s.id}`} startOffset="50%" textAnchor="middle">
                      {label}
                    </textPath>
                  </text>
                </>
              )}
            </g>
          ))}
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-16 text-center">
        <span className="text-xs font-semibold text-muted">{centerLabel}</span>
        <span className="num text-lg font-extrabold leading-tight" aria-label={hidden ? "hidden" : undefined}>
          {hidden ? MASK : formatPHP(centerValue)}
        </span>
      </div>
    </div>
  );
}
