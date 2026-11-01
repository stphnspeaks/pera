"use client";

import { motion } from "framer-motion";
import { createElement } from "react";
import mark from "@/lib/nest-mark.json";

type Shape = { tag: string } & Record<string, string | number>;

/** Geometry lives in src/lib/nest-mark.json and is shared with scripts/generate-icons.mjs. */
const render = (shapes: Shape[]) =>
  shapes.map(({ tag, ...attrs }, i) => createElement(tag, { key: i, ...attrs }));

const box = { transformBox: "fill-box" as const };

/**
 * A bird in a nest with a coin. With `animate`: the bird pops up, a coin drops into the
 * nest and bounces, then the bird flaps its wing.
 */
export default function Logo({
  size = 32,
  animate = false,
  background = false,
}: {
  size?: number;
  animate?: boolean;
  background?: boolean;
}) {
  const a = animate;
  const body = (
    <motion.g
      style={{ ...box, transformOrigin: "50% 100%" }}
      initial={a ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <g>{render(mark.back as unknown as Shape[])}</g>

      {/* bird rises out of the nest */}
      <motion.g
        initial={a ? { y: 90 } : false}
        animate={{ y: 0 }}
        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* little hop while the wing flaps */}
        <motion.g
          animate={a ? { y: [0, -8, 0, -8, 0] } : undefined}
          transition={{ delay: 1.1, duration: 0.8, ease: "easeInOut" }}
        >
          {render(mark.bird as unknown as Shape[])}
          <motion.g
            style={{ ...box, transformOrigin: "85% 50%" }}
            animate={a ? { rotate: [0, -40, 6, -40, 6, -28, 0] } : undefined}
            transition={{ delay: 1.1, duration: 0.85, ease: "easeInOut" }}
          >
            {render(mark.wing as unknown as Shape[])}
          </motion.g>
        </motion.g>
      </motion.g>

      {/* coin drops in and settles in front of the bird, behind the nest lip */}
      <motion.g
        initial={a ? { y: -330, opacity: 0 } : false}
        animate={a ? { y: [-330, 0, -20, 0, -6, 0], opacity: [0, 1, 1, 1, 1, 1] } : undefined}
        transition={{
          delay: 0.5,
          duration: 0.75,
          times: [0, 0.5, 0.68, 0.82, 0.92, 1],
          ease: ["easeIn", "easeOut", "easeIn", "easeOut", "easeIn"],
        }}
      >
        {render(mark.coin as unknown as Shape[])}
      </motion.g>

      <g>{render(mark.front as unknown as Shape[])}</g>
    </motion.g>
  );

  if (background) {
    return (
      <svg width={size} height={size} viewBox="0 0 512 512" role="img" aria-label="Nest logo" fill="none">
        <rect width="512" height="512" rx="120" fill="#1d7a5f" />
        <g transform="translate(0 -57)">{body}</g>
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={(size * 346) / 400}
      viewBox="56 140 400 346"
      role="img"
      aria-label="Nest logo"
      fill="none"
      overflow="visible"
    >
      {body}
    </svg>
  );
}
