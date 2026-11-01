"use client";

import { motion } from "framer-motion";
import { Delete, Lock as LockIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import config from "@config";
import { verifyPin } from "@/lib/pin";

export default function Lock({ pinHash, onUnlock }: { pinHash: string; onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [shake, setShake] = useState(0);
  const busy = useRef(false);

  useEffect(() => {
    if (pin.length < 4 || busy.current) return;
    busy.current = true;
    verifyPin(pin, pinHash)
      .then((ok) => {
        if (ok) onUnlock();
        else if (pin.length >= 6) {
          setShake((s) => s + 1);
          setPin("");
        }
      })
      .finally(() => (busy.current = false));
  }, [pin, pinHash, onUnlock]);

  const press = (d: string) => setPin((p) => (p.length < 6 ? p + d : p));

  return (
    <div className="safe-top safe-bottom fixed inset-0 z-[90] flex flex-col items-center justify-between px-6 py-10">
      <div className="mt-8 flex flex-col items-center gap-2">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-soft">
          <LockIcon size={26} />
        </span>
        <h1 className="text-xl font-extrabold">{config.name} is locked</h1>
        <p className="text-sm text-muted" aria-live="polite">
          {shake > 0 && pin.length === 0 ? "Wrong PIN, try again" : "Enter your PIN"}
        </p>
      </div>

      <motion.div
        key={shake}
        className="flex gap-3"
        animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
        aria-label={`${pin.length} digits entered`}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={`h-3.5 w-3.5 rounded-full border-2 border-fg ${i < pin.length ? "bg-fg" : ""}`}
          />
        ))}
      </motion.div>

      <div className="grid w-full max-w-[300px] grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <Key key={d} onClick={() => press(d)}>
            {d}
          </Key>
        ))}
        <span />
        <Key onClick={() => press("0")}>0</Key>
        {pin.length > 0 ? (
          <Key onClick={() => setPin((p) => p.slice(0, -1))} label="Delete">
            <Delete size={24} />
          </Key>
        ) : (
          <span aria-hidden />
        )}
      </div>
    </div>
  );
}

function Key({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="pressable flex h-16 border border-line bg-card items-center justify-center rounded-full text-2xl font-bold"
    >
      {children}
    </button>
  );
}
