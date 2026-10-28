"use client";

import { motion } from "framer-motion";

/** Three rising bars with a coin ring. Keep geometry in sync with scripts/generate-icons.mjs. */
const BARS = [
  { x: 124, h: 100 },
  { x: 224, h: 170 },
  { x: 324, h: 250 },
];
const BASE = 396;

export default function Logo({
  size = 32,
  animate = false,
  background = false,
}: {
  size?: number;
  animate?: boolean;
  background?: boolean;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Logo" fill="none">
      <defs>
        <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6fc0ff" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {background && <rect width="512" height="512" rx="120" fill="url(#logo-bg)" />}
      {BARS.map((b, i) => (
        <motion.rect
          key={b.x}
          x={b.x}
          y={BASE - b.h}
          width="64"
          height={b.h}
          rx="22"
          fill="#fff"
          style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          initial={animate ? { scaleY: 0, opacity: 0 } : false}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ delay: 0.15 + i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
      <motion.circle
        cx="156"
        cy="196"
        r="34"
        stroke="#fff"
        strokeWidth="16"
        initial={animate ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}
