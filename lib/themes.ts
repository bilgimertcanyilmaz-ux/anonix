/**
 * Premium profil temaları (Ultra Plus — Stage 17).
 * Sınıflar statik tutulur ki Tailwind JIT derlemeye dahil etsin.
 *
 * Her tema, public/frames/ altındaki 2x2 grid PNG'lerin bir kadranına bağlıdır.
 * `frameSrc`: PNG dosyası, `frameBgPos`: hangi kadran (background-position)
 *   - "0% 0%"     → sol-üst
 *   - "100% 0%"   → sağ-üst
 *   - "0% 100%"   → sol-alt
 *   - "100% 100%" → sağ-alt
 */
export interface PremiumTheme {
  id: string;
  name: string;
  /** Avatar çerçevesi (gradient ring) — kart önizlemesi dışında kullanılır. */
  ring: string;
  /** Önizleme baloncuğu (eski API uyumluluğu). */
  preview: string;
  /** Premium PNG çerçeve görselinin yolu (public içinde). */
  frameSrc: string;
  /** PNG içindeki hangi 2x2 kadranı kırpılacak. */
  frameBgPos: string;
  /** Tema accent rengi (kart border'ı ve seçili glow için). */
  accent: string;
}

export const PREMIUM_THEMES: PremiumTheme[] = [
  {
    id: "neon_purple",
    name: "Neon Purple",
    ring: "bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-600",
    preview: "bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-violet-600",
    frameSrc: "/frames/set1-tl.png",
    frameBgPos: "center",
    accent: "#d946ef",
  },
  {
    id: "electric_blue",
    name: "Electric Blue",
    ring: "bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600",
    preview: "bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600",
    frameSrc: "/frames/set1-tr.png",
    frameBgPos: "center",
    accent: "#3b82f6",
  },
  {
    id: "midnight_gold",
    name: "Midnight Gold",
    ring: "bg-gradient-to-tr from-amber-300 via-yellow-500 to-amber-600",
    preview: "bg-gradient-to-tr from-amber-300 via-yellow-500 to-amber-600",
    frameSrc: "/frames/set1-bl.png",
    frameBgPos: "center",
    accent: "#fbbf24",
  },
  {
    id: "cyber_pink",
    name: "Cyber Pink",
    ring: "bg-gradient-to-tr from-pink-400 via-rose-500 to-fuchsia-600",
    preview: "bg-gradient-to-tr from-pink-400 via-rose-500 to-fuchsia-600",
    frameSrc: "/frames/set1-br.png",
    frameBgPos: "center",
    accent: "#ec4899",
  },
  {
    id: "crimson",
    name: "Crimson",
    ring: "bg-gradient-to-tr from-red-500 via-rose-600 to-red-700",
    preview: "bg-gradient-to-tr from-red-500 via-rose-600 to-red-700",
    frameSrc: "/frames/set2-br.png",
    frameBgPos: "center",
    accent: "#ef4444",
  },
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
