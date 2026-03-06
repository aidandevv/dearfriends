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
        linen: "#F5EFE4",
        surface: "#FAF7F1",
        "surface-raised": "#FFFFFF",
        terra: "#C05C2E",
        "terra-dark": "#9E4A23",
        ink: "#231209",
        "ink-muted": "#7A6352",
        border: "#DDD0BC",
        sage: "#5A7A5A",
        sidebar: "#EDE6D6",
      },
    },
  },
  plugins: [typography],
};
export default config;
