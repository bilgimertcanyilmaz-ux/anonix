/**
 * Anonix marka renk sistemi (tek kaynak).
 * tailwind.config.ts ile birebir uyumludur; JS tarafında (OG görseli, grafik,
 * inline stil) renklere erişmek için kullanılır.
 */

export const colors = {
  // Koyu zemin (siyah → lacivert)
  ink: {
    950: "#06060b",
    900: "#0a0a14",
    800: "#11111f",
    700: "#181828",
    600: "#22223a",
  },
  // Ana marka: mor / menekşe (neon mor = brand-400/500)
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
  // İkincil vurgu: elektrik mavi / indigo
  accent: {
    400: "#5b8def",
    500: "#3b6fe0",
    600: "#2b54c4",
  },
  // Premium altın accent
  gold: {
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
  },
} as const;

/** Dark mode anlamsal renkler. */
export const darkTheme = {
  background: colors.ink[950],
  surface: "rgba(255,255,255,0.03)",
  text: "#ffffff",
  textMuted: "#94a3b8",
  primary: colors.brand[500],
  accent: colors.accent[500],
  gold: colors.gold[400],
} as const;

/** Light mode anlamsal renkler (beyaz/gri/lavanta/pastel mor). */
export const lightTheme = {
  background: "#f5f3ff", // lavanta beyaz
  surface: "#ffffff",
  text: "#0f172a",
  textMuted: "#64748b",
  primary: colors.brand[600],
  accent: colors.accent[600],
  gold: colors.gold[500],
} as const;

export const brandGradient = "linear-gradient(135deg, #7c3aed 0%, #4c1d95 45%, #1e1b4b 100%)";
