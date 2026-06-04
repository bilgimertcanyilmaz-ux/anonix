/**
 * Premium profil temaları — rütbe çerçeveleri (Ultra Plus).
 *
 * Her tema, public/frames/rank-*.png içindeki bireysel taç+yüzük tasarımına bağlıdır.
 * Sınıflar statik tutulur ki Tailwind JIT derlemeye dahil etsin.
 */
export interface PremiumTheme {
  id: string;
  name: string;
  /** Avatar çerçevesi (gradient ring) — kart önizlemesi dışında kullanılır. */
  ring: string;
  /** Önizleme baloncuğu (eski API uyumluluğu). */
  preview: string;
  /** Bireysel PNG çerçevenin yolu (public içinde). */
  frameSrc: string;
  /** Tema accent rengi (border + glow için). */
  accent: string;
}

export const PREMIUM_THEMES: PremiumTheme[] = [
  {
    id: "bronze",
    name: "Bronze",
    ring: "bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-700",
    preview: "bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-700",
    frameSrc: "/frames/rank-bronze.png",
    accent: "#ea580c",
  },
  {
    id: "silver",
    name: "Silver",
    ring: "bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-500",
    preview: "bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-500",
    frameSrc: "/frames/rank-silver.png",
    accent: "#cbd5e1",
  },
  {
    id: "gold",
    name: "Gold",
    ring: "bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600",
    preview: "bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600",
    frameSrc: "/frames/rank-gold.png",
    accent: "#fbbf24",
  },
  {
    id: "platinum",
    name: "Platinum",
    ring: "bg-gradient-to-tr from-teal-300 via-cyan-400 to-sky-500",
    preview: "bg-gradient-to-tr from-teal-300 via-cyan-400 to-sky-500",
    frameSrc: "/frames/rank-platinum.png",
    accent: "#22d3ee",
  },
  {
    id: "diamond",
    name: "Diamond",
    ring: "bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600",
    preview: "bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600",
    frameSrc: "/frames/rank-diamond.png",
    accent: "#c084fc",
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
