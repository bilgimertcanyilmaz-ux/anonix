/**
 * Anonix tasarım sistemi — tek merkez.
 * Renk + tipografi + spacing + radius + shadow + buton + glow standartları.
 * Bileşenler bu sabitleri (ve eşdeğer Tailwind sınıflarını) kullanır.
 */
import { colors, brandGradient } from "@/styles/colors";
import { fontFamily, fontSize, fontWeight, textStyles } from "@/styles/typography";

export const radius = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem", // rounded-xl
  xl: "1.5rem", // rounded-2xl
  full: "9999px",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
} as const;

export const shadow = {
  glow: "0 0 40px -10px rgba(124,58,237,0.55)",
  card: "0 8px 30px -12px rgba(0,0,0,0.6)",
} as const;

/** Buton sistemi — Tailwind sınıf grupları (components/ui/Button ile uyumlu). */
export const buttons = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10",
  pill: "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
} as const;

export const card = "rounded-2xl border border-white/5 bg-white/[0.03] shadow-card";

export const motion = {
  fadeUp: "animate-fade-up",
  float: "animate-float",
  press: "transition-transform active:scale-95",
} as const;

export const theme = {
  colors,
  brandGradient,
  fontFamily,
  fontSize,
  fontWeight,
  textStyles,
  radius,
  spacing,
  shadow,
  buttons,
  card,
  motion,
} as const;

export default theme;
