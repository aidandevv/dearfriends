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
        linen: "#F8F3EA",
        surface: "#faf4e4",
        "surface-raised": "#FFFFFF",
        "blue-ink": "#3358ba",
        "blue-mid": "#3e5da0",
        ink: "#1d2442",
        "ink-muted": "#6b7290",
        border: "#d9cfb0",
        sage: "#5A7A5A",
        sidebar: "#EDE6D4",
        cream: "#E4CE95",
        "blue-slate": "#516183",
        stamp: "#b8453b",
      },
    },
  },
  plugins: [typography],
};
export default config;
