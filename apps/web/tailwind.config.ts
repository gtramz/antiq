import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#000000",
        surface: "#080E18",
        surfaceAlt: "#0C1628",
        border: "#1A2A40",
        ink: "#F5F7FA",
        muted: "#8B93A7",
        tertiary: "#5C6578",
        accent: "#6A8FBF",
        success: "#5FB47C",
        danger: "#C7615B",
      },
      fontFamily: {
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        phone: "430px",
        content: "1120px",
      },
      screens: {
        /** Web layout kicks in — phone chrome below this. */
        lg: "1024px",
      },
      borderRadius: {
        /** Capsule — controls, chips, CTAs */
        soft: "9999px",
        /** High-round containers */
        surface: "32px",
        card: "32px",
        band: "9999px",
      },
      keyframes: {
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "expand-in": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "sheet-up": "sheet-up 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        "fade-in": "fade-in 220ms ease-out",
        "expand-in": "expand-in 240ms ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
