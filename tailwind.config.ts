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
          DEFAULT: "#080808", // Noir profond
          soft: "#111111", // Noir secondaire
          800: "#1a1a1a",
          700: "#262626",
        },
        cream: "#F8F3EA", // Blanc cassé
        gold: {
          DEFAULT: "#F59E0B", // Orange doré
          600: "#D97706",
          400: "#FBBF24",
        },
        forest: {
          DEFAULT: "#123524", // Vert profond
          600: "#1B5E36",
        },
        muted: "#A3A3A3", // Gris texte
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
        glow: "0 0 0 1px rgba(245,158,11,0.25), 0 12px 40px -12px rgba(245,158,11,0.35)",
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
          "radial-gradient(1200px 600px at 70% 10%, rgba(245,158,11,0.18), transparent 60%)",
        kente:
          "repeating-linear-gradient(45deg, rgba(245,158,11,0.08) 0 10px, transparent 10px 20px)",
      },
    },
  },
  plugins: [],
};
export default config;
