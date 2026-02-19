// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config & { daisyui?: { themes?: unknown[]; darkTheme?: boolean} } = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      maxWidth: {
        content: "1280px",
        wide: "1536px",
      },
      spacing: {
        section: "5rem",
        "section-lg": "7rem",
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["autumn"],
    darkTheme: false,
  },
};

export default config;