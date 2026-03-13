import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/data/levels/difficulty.ts",
    "./node_modules/@openzeppelin/ui-builder-ui/dist/*.js",
  ],
  safelist: [
    /* Difficulty badge and text (values from difficulty.ts – used via dynamic keys) */
    "text-move-success",
    "text-move-warning",
    "text-red-400",
    "bg-move-success/20",
    "bg-move-warning/20",
    "bg-red-500/20",
  ],
  theme: {
    extend: {
      colors: {
        /* OpenZeppelin: Violet #4F56FA, Grey #15193A – dark theme */
        "oz-violet": "#4F56FA",
        "oz-white": "#FFFFFF",
        "oz-grey": "#15193A",
        "oz-black": "#000000",
        /* Semantic – values from CSS variables for light/dark */
        "move-dark": "var(--move-dark)",
        "move-panel": "var(--move-panel)",
        "move-border": "var(--move-border)",
        "move-accent": "var(--move-accent)",
        "move-success": "#3fb950",
        "move-warning": "#d29922",
        "move-text": "var(--move-text)",
        "move-muted": "var(--move-muted)",
        "move-code-bg": "var(--move-dark)",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
