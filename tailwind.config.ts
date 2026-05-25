import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Koyu zemin tonları (siyah → lacivert)
        ink: {
          950: "#06060b",
          900: "#0a0a14",
          800: "#11111f",
          700: "#181828",
          600: "#22223a",
        },
        // Ana marka rengi: mor / menekşe
        brand: {
          50: "#f3effe",
          100: "#e6dcfd",
          200: "#cbb6fb",
          300: "#ad8df8",
          400: "#9163f3",
          500: "#7c3aed",
          600: "#6d28d9",
          700: "#5b21b6",
          800: "#4c1d95",
          900: "#3b1378",
        },
        // İkincil vurgu: lacivert / indigo
        accent: {
          400: "#5b8def",
          500: "#3b6fe0",
          600: "#2b54c4",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #7c3aed 0%, #4c1d95 45%, #1e1b4b 100%)",
        "app-gradient":
          "radial-gradient(1200px 600px at 50% -10%, rgba(124,58,237,0.18), transparent 60%), linear-gradient(180deg, #0a0a14 0%, #06060b 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(124,58,237,0.55)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
