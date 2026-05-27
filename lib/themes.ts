/**
 * Premium profil temaları (Ultra Plus — Stage 17).
 * Sınıflar statik tutulur ki Tailwind JIT derlemeye dahil etsin.
 */
export interface PremiumTheme {
  id: string;
  name: string;
  /** Avatar çerçevesi (gradient ring). */
  ring: string;
  /** Önizleme baloncuğu. */
  preview: string;
}

export const PREMIUM_THEMES: PremiumTheme[] = [
  { id: "neon_purple", name: "Neon Purple", ring: "bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-600", preview: "bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-600" },
  { id: "electric_blue", name: "Electric Blue", ring: "bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600", preview: "bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600" },
  { id: "midnight_gold", name: "Midnight Gold", ring: "bg-gradient-to-tr from-amber-300 via-yellow-500 to-amber-600", preview: "bg-gradient-to-tr from-amber-300 via-yellow-500 to-amber-600" },
  { id: "cyber_pink", name: "Cyber Pink", ring: "bg-gradient-to-tr from-pink-400 via-rose-500 to-fuchsia-600", preview: "bg-gradient-to-tr from-pink-400 via-rose-500 to-fuchsia-600" },
  { id: "crimson", name: "Crimson", ring: "bg-gradient-to-tr from-red-500 via-rose-600 to-red-700", preview: "bg-gradient-to-tr from-red-500 via-rose-600 to-red-700" },
];

/** Tema id'sinden tanım (yoksa null). */
export function getPremiumTheme(id: string | null | undefined): PremiumTheme | null {
  if (!id) return null;
  return PREMIUM_THEMES.find((t) => t.id === id) ?? null;
}

/**
 * Premium tema varsa avatar çerçevesi için ring sınıfı + glow döndürür.
 * Yoksa boş string (mevcut cinsiyet çerçevesi kullanılmaya devam eder).
 */
export function premiumThemeRing(id: string | null | undefined): string {
  const t = getPremiumTheme(id);
  return t ? `${t.ring} shadow-glow` : "";
}
