import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#c2652a",
        "on-primary": "#ffffff",
        "primary-container": "#f8eadd",
        "on-primary-container": "#452109",
        secondary: "#7a5941",
        "on-secondary": "#ffffff",
        "secondary-container": "#f0e4db",
        "on-secondary-container": "#2c1a0e",
        tertiary: "#5a623a",
        "on-tertiary": "#ffffff",
        background: "#faf7f2",
        "on-background": "#1e1b19",
        surface: "#fdfbf8",
        "on-surface": "#1e1b19",
        "surface-variant": "#f2eae1",
        "on-surface-variant": "#50453e",
        outline: "#83756d",
        "outline-variant": "#d5c9c1",
        "inverse-surface": "#342f2b",
        "inverse-on-surface": "#f9efea",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f7f3ed",
        "surface-container": "#f1ede7",
        "surface-container-high": "#ebe7e1",
        "surface-container-highest": "#e5e1db",
        error: "#b3261e",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      spacing: {
        gutter: "24px",
        "margin-edge": "40px",
        "panel-padding": "24px",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        body: ["var(--font-manrope)", "sans-serif"],
        code: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-lg": ["32px", { lineHeight: "40px", fontWeight: "600" }],
        "headline-md": ["24px", { lineHeight: "32px", fontWeight: "600" }],
        "body-lg": ["18px", { lineHeight: "28px" }],
        "body-md": ["16px", { lineHeight: "24px" }],
        "body-sm": ["14px", { lineHeight: "20px" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.08em", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};

export default config;
