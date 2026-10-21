import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "#0B0D12",
          950: "#07080C",
          900: "#0B0D12",
          850: "#10131B",
          800: "#151924",
          700: "#1E2433",
        },
        memoryBlue: {
          DEFAULT: "#4967FF",
          light: "#6982FF",
          dark: "#324ED6",
          glow: "rgba(73, 103, 255, 0.25)",
        },
        ultraviolet: {
          DEFAULT: "#8066FF",
          light: "#9A85FF",
          dark: "#6347E6",
          glow: "rgba(128, 102, 255, 0.25)",
        },
        signalLilac: {
          DEFAULT: "#B7A8FF",
          light: "#CDC3FF",
          dark: "#9E8CE6",
        },
        silverMist: {
          DEFAULT: "#B9C0CE",
          light: "#D2D7E2",
          dark: "#848D9E",
        },
        coldWhite: {
          DEFAULT: "#F7F8FC",
          muted: "rgba(247, 248, 252, 0.7)",
          faint: "rgba(247, 248, 252, 0.05)",
        },
      },
    },
  },
  plugins: [],
};
export default config;
