import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
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
        // Ana marka rengi: mor / menekşe (neon purple)
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
        // İkincil vurgu: electric blue / indigo
        accent: {
          400: "#5b8def",
          500: "#3b6fe0",
          600: "#2b54c4",
        },
        // Neon palet — UI redesign
        neon: {
          violet: "#a855f7",
          purple: "#7c3aed",
          electric: "#3b82f6",
          cyan: "#06b6d4",
          pink: "#ec4899",
          magenta: "#d946ef",
        },
        // Lavender / soft pink (light mode öncelikli)
        lavender: {
          50: "#f8f7ff",
          100: "#f0edff",
          200: "#e0d9ff",
          300: "#c7baff",
          400: "#a78bfa",
          500: "#8b5cf6",
        },
        // Ultra Plus altın
        gold: {
          300: "#fde68a",
          400: "#fcd34d",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        "4xl": "2.5rem",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #7c3aed 0%, #4c1d95 45%, #1e1b4b 100%)",
        "app-gradient":
          "radial-gradient(1200px 600px at 50% -10%, rgba(124,58,237,0.18), transparent 60%), linear-gradient(180deg, #0a0a14 0%, #06060b 100%)",
        // Premium gradients — UI redesign
        "neon-purple": "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #4c1d95 100%)",
        "neon-electric": "linear-gradient(135deg, #3b82f6 0%, #7c3aed 50%, #a855f7 100%)",
        "ultra-gold":
          "linear-gradient(135deg, #f59e0b 0%, #fcd34d 35%, #7c3aed 100%)",
        "cinematic-dark":
          "radial-gradient(800px 500px at 15% 5%, rgba(168, 85, 247, 0.22), transparent 55%), radial-gradient(700px 500px at 90% 95%, rgba(59, 130, 246, 0.18), transparent 60%), radial-gradient(1000px 700px at 50% 50%, rgba(124, 58, 237, 0.08), transparent 65%), linear-gradient(180deg, #06060b 0%, #0a0a14 100%)",
        "cinematic-light":
          "radial-gradient(900px 600px at 15% 5%, rgba(168, 85, 247, 0.16), transparent 55%), radial-gradient(800px 600px at 90% 95%, rgba(99, 102, 241, 0.10), transparent 60%), linear-gradient(180deg, #faf9ff 0%, #f0edff 100%)",
        "glass-sheen":
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.06) 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(124,58,237,0.55)",
        "glow-sm": "0 0 18px -6px rgba(124,58,237,0.5)",
        "glow-lg": "0 0 80px -20px rgba(124,58,237,0.7)",
        "glow-electric": "0 0 40px -10px rgba(59,130,246,0.5)",
        "glow-pink": "0 0 40px -10px rgba(236,72,153,0.5)",
        "glow-gold": "0 0 40px -10px rgba(252,211,77,0.55)",
        card: "0 8px 30px -12px rgba(0,0,0,0.6)",
        // Premium shadows
        "premium-sm": "0 4px 20px -4px rgba(124, 58, 237, 0.25), 0 2px 6px -2px rgba(0,0,0,0.45)",
        "premium-md": "0 12px 40px -8px rgba(124, 58, 237, 0.35), 0 4px 12px -4px rgba(0,0,0,0.55)",
        "premium-lg": "0 24px 60px -12px rgba(124, 58, 237, 0.45), 0 8px 24px -6px rgba(0,0,0,0.6)",
        "inset-glow": "inset 0 1px 0 0 rgba(255,255,255,0.08)",
      },
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
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
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 24px -4px rgba(124,58,237,0.45), 0 0 48px -12px rgba(124,58,237,0.35)",
          },
          "50%": {
            boxShadow: "0 0 36px -2px rgba(168,85,247,0.7), 0 0 72px -8px rgba(124,58,237,0.55)",
          },
        },
        "pulse-glow-gold": {
          "0%, 100%": {
            boxShadow: "0 0 24px -4px rgba(252,211,77,0.45), 0 0 48px -12px rgba(245,158,11,0.35)",
          },
          "50%": {
            boxShadow: "0 0 40px -2px rgba(252,211,77,0.7), 0 0 80px -10px rgba(124,58,237,0.5)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "border-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "blob-drift": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(20px,-15px) scale(1.05)" },
          "66%": { transform: "translate(-15px,20px) scale(0.95)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        float: "float 4s ease-in-out infinite",
        "pulse-glow": "pulse-glow 3.6s ease-in-out infinite",
        "pulse-glow-gold": "pulse-glow-gold 4.2s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "border-spin": "border-spin 8s linear infinite",
        "blob-drift": "blob-drift 14s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
