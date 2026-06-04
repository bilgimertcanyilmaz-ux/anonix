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
  /**
   * Çerçeve PNG'si içindeki halka boşluğunun (avatarın oturacağı daire)
   * geometrisi — çerçeve kutusunun kesirleri olarak. Otomatik ölçüldü.
   * cx/cy: dairenin merkezi, r: yarıçapı (0–1 arası, kutu genişliğine oranla).
   */
  hole: { cx: number; cy: number; r: number };
}

export const PREMIUM_THEMES: PremiumTheme[] = [
  {
    id: "bronze",
    name: "Bronze",
    ring: "bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-700",
    preview: "bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-700",
    frameSrc: "/frames/rank-bronze.png",
    accent: "#ea580c",
    hole: { cx: 0.459, cy: 0.516, r: 0.260 },
  },
  {
    id: "silver",
    name: "Silver",
    ring: "bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-500",
    preview: "bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-500",
    frameSrc: "/frames/rank-silver.png",
    accent: "#cbd5e1",
    hole: { cx: 0.480, cy: 0.539, r: 0.197 },
  },
  {
    id: "gold",
    name: "Gold",
    ring: "bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600",
    preview: "bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600",
    frameSrc: "/frames/rank-gold.png",
    accent: "#fbbf24",
    hole: { cx: 0.487, cy: 0.542, r: 0.218 },
  },
  {
    id: "platinum",
    name: "Platinum",
    ring: "bg-gradient-to-tr from-teal-300 via-cyan-400 to-sky-500",
    preview: "bg-gradient-to-tr from-teal-300 via-cyan-400 to-sky-500",
    frameSrc: "/frames/rank-platinum.png",
    accent: "#22d3ee",
    hole: { cx: 0.500, cy: 0.537, r: 0.201 },
  },
  {
    id: "diamond",
    name: "Diamond",
    ring: "bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600",
    preview: "bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600",
    frameSrc: "/frames/rank-diamond.png",
    accent: "#c084fc",
    hole: { cx: 0.468, cy: 0.542, r: 0.198 },
  },

  // ── Animasyonlu premium çerçeveler (GIF) ──────────────────────
  {
    id: "anim-amethyst",
    name: "Ametist Alev",
    ring: "bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-amber-500",
    preview: "bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-amber-500",
    frameSrc: "/frames/anim-1.gif",
    accent: "#a855f7",
    hole: { cx: 0.498, cy: 0.460, r: 0.130 },
  },
  {
    id: "anim-dragon",
    name: "Ejder Buzu",
    ring: "bg-gradient-to-tr from-sky-400 via-blue-600 to-amber-400",
    preview: "bg-gradient-to-tr from-sky-400 via-blue-600 to-amber-400",
    frameSrc: "/frames/anim-2.gif",
    accent: "#3b82f6",
    hole: { cx: 0.470, cy: 0.450, r: 0.115 },
  },
  {
    id: "anim-crown",
    name: "Mor Taç",
    ring: "bg-gradient-to-tr from-violet-500 via-purple-600 to-amber-400",
    preview: "bg-gradient-to-tr from-violet-500 via-purple-600 to-amber-400",
    frameSrc: "/frames/anim-3.gif",
    accent: "#9333ea",
    hole: { cx: 0.507, cy: 0.510, r: 0.127 },
  },
  {
    id: "anim-wings",
    name: "Fuşya Kanat",
    ring: "bg-gradient-to-tr from-pink-400 via-fuchsia-500 to-purple-600",
    preview: "bg-gradient-to-tr from-pink-400 via-fuchsia-500 to-purple-600",
    frameSrc: "/frames/anim-4.gif",
    accent: "#d946ef",
    hole: { cx: 0.500, cy: 0.483, r: 0.140 },
  },
  {
    id: "anim-rose",
    name: "Gül Bahçesi",
    ring: "bg-gradient-to-tr from-rose-400 via-pink-500 to-fuchsia-500",
    preview: "bg-gradient-to-tr from-rose-400 via-pink-500 to-fuchsia-500",
    frameSrc: "/frames/anim-5.gif",
    accent: "#ec4899",
    hole: { cx: 0.525, cy: 0.415, r: 0.123 },
  },
  {
    id: "anim-sapphire",
    name: "Safir Çiçeği",
    ring: "bg-gradient-to-tr from-blue-500 via-indigo-600 to-amber-400",
    preview: "bg-gradient-to-tr from-blue-500 via-indigo-600 to-amber-400",
    frameSrc: "/frames/anim-6.gif",
    accent: "#2563eb",
    hole: { cx: 0.507, cy: 0.455, r: 0.130 },
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
