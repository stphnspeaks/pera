import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--bg)",
        card: "var(--card)",
        card2: "var(--card-2)",
        soft: "var(--card-2)",
        line: "var(--line)",
        fg: "var(--fg)",
        brand: "var(--brand)",
        mint: "var(--mint)",
        "mint-fg": "var(--mint-fg)",
        peach: "var(--peach)",
        "peach-fg": "var(--peach-fg)",
        accent: "var(--accent)",
        up: "var(--up)",
        down: "var(--down)",
        muted: "var(--muted)",
        nav: "var(--nav)",
        sheet: "var(--sheet)",
        "sheet-fg": "var(--sheet-fg)",
        "sheet-muted": "var(--sheet-muted)",
        "sheet-field": "var(--sheet-field)",
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      borderRadius: { "4xl": "2rem" },
    },
  },
  plugins: [],
};
export default config;
