/** Anonix tipografi sistemi (tek kaynak). Inter ailesi. */

export const fontFamily = {
  sans: "var(--font-inter), system-ui, sans-serif",
};

/** Ölçek — Tailwind sınıf karşılıkları (referans). */
export const fontSize = {
  xs: "0.75rem", // text-xs
  sm: "0.875rem", // text-sm
  base: "1rem", // text-base
  lg: "1.125rem", // text-lg
  xl: "1.25rem", // text-xl
  "2xl": "1.5rem", // text-2xl
  "3xl": "1.875rem",
  "4xl": "2.25rem",
  "5xl": "3rem",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

/** Hazır metin stilleri (Tailwind sınıf grupları). */
export const textStyles = {
  pageTitle: "text-2xl font-extrabold tracking-tight",
  sectionTitle: "text-lg font-bold",
  body: "text-sm leading-relaxed",
  caption: "text-xs text-slate-400",
  gradient: "text-gradient",
} as const;
