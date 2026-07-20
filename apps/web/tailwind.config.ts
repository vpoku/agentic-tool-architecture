import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#fafafa",
        foreground: "#0a0a0a",
        muted: "#737373",
        border: "#e5e5e5",
        card: "#ffffff",
        accent: "#2563eb",
        "accent-hover": "#1d4ed8",
        "accent-muted": "#eff6ff",
        success: "#16a34a",
        warning: "#ca8a04",
        danger: "#dc2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        panel: "0 4px 24px -4px rgb(0 0 0 / 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
