import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette restaurant
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          soft: "rgb(var(--color-ink-soft) / <alpha-value>)",
          800: "rgb(var(--color-ink-800) / <alpha-value>)",
          700: "rgb(var(--color-ink-700) / <alpha-value>)",
        },
        cream: "rgb(var(--color-cream) / <alpha-value>)",
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          600: "rgb(var(--color-gold-600) / <alpha-value>)",
          400: "rgb(var(--color-gold-400) / <alpha-value>)",
        },
        forest: {
          DEFAULT: "rgb(var(--color-forest) / <alpha-value>)",
          600: "rgb(var(--color-forest-600) / <alpha-value>)",
        },
        muted: "rgb(var(--color-muted) / <alpha-value>)",
      },
      screens: {
        "3xl": "1920px",
        "4xl": "2560px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(0,0,0,0.25)",
        card: "0 18px 50px -20px rgba(0,0,0,0.45)",
        glow: "0 0 0 1px rgb(var(--color-gold) / 0.25), 0 12px 40px -12px rgb(var(--color-gold) / 0.35)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(1200px 600px at 70% 10%, rgb(var(--color-gold) / 0.18), transparent 60%)",
        kente:
          "repeating-linear-gradient(45deg, rgb(var(--color-gold) / 0.08) 0 10px, transparent 10px 20px)",
      },
    },
  },
  plugins: [],
};
export default config;
