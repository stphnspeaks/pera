"use client";

import { motion } from "framer-motion";
import config from "@config";
import Logo from "./Logo";

export default function Splash() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5"
      style={{ background: config.backgroundColor }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      aria-label={`${config.name} is loading`}
    >
      <Logo size={200} animate />
      <motion.span
        className="text-4xl font-extrabold tracking-tight text-white"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.25, duration: 0.45, ease: "easeOut" }}
      >
        {config.name}
      </motion.span>
    </motion.div>
  );
}
