"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const titleId = useId();
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-[#030a1e]/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="sheet-surface relative flex max-h-[92dvh] w-full max-w-[480px] flex-col rounded-t-[36px] sheet-panel text-sheet-fg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragListener={false}
            dragControls={controls}
            onDragEnd={(_, info) => info.offset.y > 120 && onClose()}
          >
            <div
              className="touch-none px-5 pt-2.5"
              onPointerDown={(e) => controls.start(e)}
            >
              <span className="mx-auto mb-2 block h-1.5 w-11 rounded-full bg-line" />
              <div className="flex items-center justify-between pb-2">
              <h2 id={titleId} className="text-xl font-extrabold tracking-tight">
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="pressable -mr-2 flex h-11 w-11 items-center justify-center rounded-full bg-sheet-field"
              >
                <X size={20} />
              </button>
              </div>
            </div>
            <div className="safe-bottom overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
