import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff1f1",
          100: "#ffdede",
          200: "#ffc2c2",
          300: "#ff9696",
          400: "#ff5c5c",
          500: "#ef2b2b",
          600: "#dc1414",
          700: "#b80f0f",
          800: "#971212",
          900: "#7c1616",
        },
      },
      boxShadow: {
        soft: "0 8px 30px -10px rgba(220,20,20,0.18)",
      },
      animation: {
        "fade-up": "fadeUp .5s ease-out both",
        "pop": "pop .35s ease-out both",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { transform: "scale(.95)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
      },
    },
  },
  plugins: [],
} satisfies Config;
