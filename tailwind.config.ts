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
        serif: ["var(--font-ppwriter)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        porcelain: "#F8F9FB",
        linen: "#F8F9FB",
        surface: "#EEF1F6",
        "surface-raised": "#FFFFFF",
        periwinkle: { DEFAULT: "#4A6CD4", deep: "#3A55AC" },
        peach: "#E8927C",
        "blue-ink": "#3358ba",
        "blue-mid": "#3e5da0",
        ink: "#232940",
        "ink-soft": "#4A5168",
        "ink-muted": "#8A91A6",
        border: "#DFE3EC",
        line: "#DFE3EC",
        sage: "#5A7A5A",
        sidebar: "#EAEAE6",
        cream: "#EEF1F6",
        "blue-slate": "#516183",
        stamp: "#b8453b",
      },
    },
  },
  plugins: [typography],
};
export default config;
