import type { AccountType } from "./types";

export interface Preset {
  key: string;
  name: string;
  initials: string;
  type: AccountType;
  color: string;
  /** optional bank logo tile in /public/logos */
  logo?: string;
}

/** Presets with a logo file show it; the rest (BPI, BDO, Cash) use a colored monogram badge. */
export const PRESETS: Preset[] = [
  { key: "bpi", name: "BPI", initials: "BPI", type: "Bank", color: "#b4313a" },
  { key: "bdo", name: "BDO", initials: "BDO", type: "Bank", color: "#2457b8" },
  { key: "metrobank", name: "Metrobank", initials: "MB", type: "Bank", color: "#1d6fb5", logo: "/logos/metrobank.webp" },
  { key: "unionbank", name: "UnionBank", initials: "UB", type: "Bank", color: "#c4651a", logo: "/logos/unionbank.webp" },
  { key: "landbank", name: "Landbank", initials: "LB", type: "Bank", color: "#2f8f4e", logo: "/logos/landbank.webp" },
  { key: "securitybank", name: "Security Bank", initials: "SB", type: "Bank", color: "#2e8b3d", logo: "/logos/securitybank.webp" },
  { key: "pnb", name: "PNB", initials: "PNB", type: "Bank", color: "#2b4fa0", logo: "/logos/pnb.webp" },
  { key: "rcbc", name: "RCBC", initials: "RC", type: "Bank", color: "#1c4c9c", logo: "/logos/rcbc.webp" },
  { key: "maribank", name: "Maribank", initials: "MA", type: "Bank", color: "#7a4fd1", logo: "/logos/maribank.webp" },
  { key: "gotyme", name: "GoTyme", initials: "GT", type: "Bank", color: "#0f8f8a", logo: "/logos/gotyme.webp" },
  { key: "cimb", name: "CIMB", initials: "CI", type: "Bank", color: "#c0262f", logo: "/logos/cimb.webp" },
  { key: "tonik", name: "Tonik", initials: "TK", type: "Bank", color: "#8b3fd0", logo: "/logos/tonik.webp" },
  { key: "gcash", name: "GCash", initials: "G", type: "E-wallet", color: "#1b73e8", logo: "/logos/gcash.webp" },
  { key: "maya", name: "Maya", initials: "MY", type: "E-wallet", color: "#1a9a68", logo: "/logos/maya.webp" },
  { key: "cash", name: "Cash", initials: "CA", type: "Cash", color: "#5a7a3a" },
];

export const SWATCHES = [
  "#2457b8", "#1b73e8", "#0f8f8a", "#1a9a68", "#5a7a3a", "#b8860b",
  "#d1522a", "#c0262f", "#b4313a", "#8b3fd0", "#7a4fd1", "#4a5a7a",
];

export function makeInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Finds the logo for an account by its name, so accounts made before logos existed pick them up too. */
export function logoForName(name: string): string | undefined {
  const n = name.trim().toLowerCase();
  return PRESETS.find((p) => p.logo && p.name.toLowerCase() === n)?.logo;
}
