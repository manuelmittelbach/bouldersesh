import type { Config } from "tailwindcss";

// Tokens mirror the Boulder Buddy Design System (../Boulder Buddy Design System/tokens).
// Direction: cool, athletic, sparse — Send Orange used as one bold hit per view
// against a cool graphite "rock" neutral scale. Grades read as data (mono).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      colors: {
        // Brand — Send Orange (#f25c16), deeper/cooler than the old Tailwind orange.
        brand: {
          50: "#fff4ed",
          100: "#ffe4d2",
          200: "#fec5a4",
          300: "#fd9d6c",
          400: "#fb7a3c",
          500: "#f25c16",
          600: "#d8480a",
          700: "#b3380c",
          800: "#8f2f11",
          900: "#742a12",
          DEFAULT: "#f25c16",
        },
        // Neutrals — Rock: cool graphite with a faint blue cast (concrete, not sand).
        rock: {
          0: "#ffffff",
          25: "#f7f8fa",
          50: "#f1f3f6",
          100: "#e6e9ee",
          200: "#d3d8e0",
          300: "#b2bac6",
          400: "#8b93a3",
          500: "#646c7d",
          600: "#49515f",
          700: "#353b47",
          800: "#23272f",
          900: "#16181d",
          950: "#0e0f13",
        },
        // Climbing-grade bands — muted, read as data not candy.
        grade: {
          beginner: "#e3f3ec",
          "beginner-ink": "#1f7a52",
          intermediate: "#e2edf7",
          "intermediate-ink": "#2664a8",
          advanced: "#fde6d6",
          "advanced-ink": "#b3490f",
          pro: "#f9e0e0",
          "pro-ink": "#a92d2d",
        },
        success: { DEFAULT: "#1f7a52", surface: "#e3f3ec" },
        warning: { DEFAULT: "#9a6a12", surface: "#fbeed2" },
        danger: { DEFAULT: "#b03333", surface: "#f9e0e0" },
      },
      borderRadius: {
        xs: "6px",
        sm: "10px",
        md: "12px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(22, 24, 29, 0.06)",
        sm: "0 1px 3px rgba(22, 24, 29, 0.08), 0 1px 2px rgba(22, 24, 29, 0.04)",
        md: "0 4px 12px -2px rgba(22, 24, 29, 0.12)",
        lg: "0 12px 28px -8px rgba(22, 24, 29, 0.20)",
        nav: "0 -6px 20px -12px rgba(22, 24, 29, 0.18)",
        // Brand glow — reserved for the FAB / primary float only.
        brand: "0 10px 24px -8px rgba(242, 92, 22, 0.45)",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
