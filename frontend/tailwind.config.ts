import type { Config } from "tailwindcss";

// Los 8 universos visuales se resuelven con CSS variables (ver theme.css),
// no con clases de Tailwind hardcodeadas — así el theme cambia en runtime.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "var(--color-surface)",
        surfaceAlt: "var(--color-surface-alt)",
        ink: "var(--color-ink)",
        inkMuted: "var(--color-ink-muted)",
        accent: "var(--color-accent)",
        accentSoft: "var(--color-accent-soft)",
        line: "var(--color-line)",
      },
      fontFamily: {
        serif: ["var(--font-serif)"],
        sans: ["var(--font-sans)"],
      },
      borderRadius: {
        card: "18px",
      },
    },
  },
  plugins: [],
} satisfies Config;
