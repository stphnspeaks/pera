"use client";

import {
  Bus,
  Ellipsis,
  GraduationCap,
  Gamepad2,
  HeartPulse,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { getCategory } from "@/lib/expenses";

const ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  groceries: ShoppingCart,
  transport: Bus,
  bills: Receipt,
  shopping: ShoppingBag,
  health: HeartPulse,
  fun: Gamepad2,
  education: GraduationCap,
  other: Ellipsis,
};

export default function CategoryIcon({
  id,
  size = 44,
  ghost = false,
}: {
  id: string;
  size?: number;
  ghost?: boolean;
}) {
  const Icon = ICONS[id] ?? Ellipsis;
  const { color } = getCategory(id);
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-[34%] text-white"
      style={{
        width: size,
        height: size,
        background: ghost ? "rgba(255,255,255,0.25)" : `linear-gradient(150deg, ${color}, ${color}cc)`,
        boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.3)",
      }}
    >
      <Icon size={size * 0.5} strokeWidth={2.3} />
    </span>
  );
}
