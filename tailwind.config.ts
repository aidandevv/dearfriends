import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        linen: "var(--linen)",
        surface: "var(--surface)",
        "surface-raised": "var(--surface-raised)",
        terra: "var(--terra)",
        "terra-dark": "var(--terra-dark)",
        ink: "var(--ink)",
        "ink-muted": "var(--ink-muted)",
        border: "var(--border)",
        sage: "var(--sage)",
        sidebar: "var(--sidebar)",
      },
    },
  },
  plugins: [typography],
};
export default config;
