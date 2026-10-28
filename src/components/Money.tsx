"use client";

import { animate, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MASK, splitMoney } from "@/lib/money";
import { useData } from "./DataProvider";

interface Props {
  centavos: number;
  className?: string;
  decimalClassName?: string;
  /** count up from the previous value when it changes */
  count?: boolean;
  /** show even when balances are hidden */
  alwaysShow?: boolean;
  /** prefix "+" for positive values */
  signed?: boolean;
}

export default function Money({
  centavos,
  className = "",
  decimalClassName = "opacity-60",
  count = false,
  alwaysShow = false,
  signed = false,
}: Props) {
  const { settings } = useData();
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(count && !reduce ? 0 : centavos);
  const prev = useRef(shown);

  useEffect(() => {
    if (!count || reduce) {
      setShown(centavos);
      prev.current = centavos;
      return;
    }
    const controls = animate(prev.current, centavos, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        prev.current = v;
        setShown(Math.round(v));
      },
      onComplete: () => {
        prev.current = centavos;
        setShown(centavos);
      },
    });
    return () => controls.stop();
  }, [centavos, count, reduce]);

  if (settings.hideBalances && !alwaysShow) {
    return (
      <span className={`num ${className}`} aria-label="Balance hidden">
        {MASK}
      </span>
    );
  }
  const { whole, decimals } = splitMoney(shown);
  const plus = signed && shown > 0 ? "+" : "";
  return (
    <span className={`num ${className}`} aria-label={count ? undefined : undefined}>
      {plus}
      {whole}
      <span className={decimalClassName}>{decimals}</span>
    </span>
  );
}
