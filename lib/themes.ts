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
  /**
   * Rütbe çerçeveleri rütbeyle açılır: bu XP eşiğine ulaşan herkes kullanabilir
   * (Ultra Plus gerekmez). Tanımsızsa çerçeve Ultra Plus ile açılır (animasyonlular).
   */
  unlockPoints?: number;
  /** Kilit etiketinde gösterilecek gereken rütbe adı (rank çerçeveleri için). */
  unlockRank?: string;
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
    unlockPoints: 0,
    unlockRank: "Sessiz Ruh",
  },
  {
    id: "silver",
    name: "Silver",
    ring: "bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-500",
    preview: "bg-gradient-to-tr from-slate-200 via-slate-400 to-slate-500",
    frameSrc: "/frames/rank-silver.png",
    accent: "#cbd5e1",
    hole: { cx: 0.480, cy: 0.539, r: 0.197 },
    unlockPoints: 3000,
    unlockRank: "Gizli Yazar",
  },
  {
    id: "gold",
    name: "Gold",
    ring: "bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600",
    preview: "bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600",
    frameSrc: "/frames/rank-gold.png",
    accent: "#fbbf24",
    hole: { cx: 0.487, cy: 0.542, r: 0.218 },
    unlockPoints: 15000,
    unlockRank: "Gölge Sakini",
  },
  {
    id: "platinum",
    name: "Platinum",
    ring: "bg-gradient-to-tr from-teal-300 via-cyan-400 to-sky-500",
    preview: "bg-gradient-to-tr from-teal-300 via-cyan-400 to-sky-500",
    frameSrc: "/frames/rank-platinum.png",
    accent: "#22d3ee",
    hole: { cx: 0.500, cy: 0.537, r: 0.201 },
    unlockPoints: 60000,
    unlockRank: "Anonim Usta",
  },
  {
    id: "diamond",
    name: "Diamond",
    ring: "bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600",
    preview: "bg-gradient-to-tr from-fuchsia-400 via-purple-500 to-violet-600",
    frameSrc: "/frames/rank-diamond.png",
    accent: "#c084fc",
    hole: { cx: 0.468, cy: 0.542, r: 0.198 },
    unlockPoints: 1000000,
    unlockRank: "Gölge Efsanesi",
  },

  // ── Animasyonlu premium çerçeveler (GIF) ──────────────────────
  {
    id: "anim-amethyst",
    name: "Ametist Alev",
    ring: "bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-amber-500",
    preview: "bg-gradient-to-tr from-fuchsia-500 via-purple-600 to-amber-500",
    frameSrc: "/frames/anim-1.gif",
    accent: "#a855f7",
    hole: { cx: 0.515, cy: 0.521, r: 0.193 },
  },
  {
    id: "anim-dragon",
    name: "Ejder Buzu",
    ring: "bg-gradient-to-tr from-sky-400 via-blue-600 to-amber-400",
    preview: "bg-gradient-to-tr from-sky-400 via-blue-600 to-amber-400",
    frameSrc: "/frames/anim-2.gif",
    accent: "#3b82f6",
    hole: { cx: 0.492, cy: 0.474, r: 0.195 },
  },
  {
    id: "anim-crown",
    name: "Mor Taç",
    ring: "bg-gradient-to-tr from-violet-500 via-purple-600 to-amber-400",
    preview: "bg-gradient-to-tr from-violet-500 via-purple-600 to-amber-400",
    frameSrc: "/frames/anim-3.gif",
    accent: "#9333ea",
    hole: { cx: 0.499, cy: 0.568, r: 0.233 },
  },
  {
    id: "anim-wings",
    name: "Fuşya Kanat",
    ring: "bg-gradient-to-tr from-pink-400 via-fuchsia-500 to-purple-600",
    preview: "bg-gradient-to-tr from-pink-400 via-fuchsia-500 to-purple-600",
    frameSrc: "/frames/anim-4.gif",
    accent: "#d946ef",
    hole: { cx: 0.463, cy: 0.435, r: 0.225 },
  },
  {
    id: "anim-rose",
    name: "Gül Bahçesi",
    ring: "bg-gradient-to-tr from-rose-400 via-pink-500 to-fuchsia-500",
    preview: "bg-gradient-to-tr from-rose-400 via-pink-500 to-fuchsia-500",
    frameSrc: "/frames/anim-5.gif",
    accent: "#ec4899",
    hole: { cx: 0.542, cy: 0.451, r: 0.193 },
  },
  {
    id: "anim-sapphire",
    name: "Safir Çiçeği",
    ring: "bg-gradient-to-tr from-blue-500 via-indigo-600 to-amber-400",
    preview: "bg-gradient-to-tr from-blue-500 via-indigo-600 to-amber-400",
    frameSrc: "/frames/anim-6.gif",
    accent: "#2563eb",
    hole: { cx: 0.505, cy: 0.470, r: 0.188 },
  },

  // ── Vektörel premium çerçeveler (SVG, gömülü animasyonlu) ─────
  {
    id: "prem-neon",
    name: "Neon Çember",
    ring: "bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500",
    preview: "bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500",
    frameSrc: "/frames/prem-neon.svg",
    accent: "#22d3ee",
    hole: { cx: 0.5, cy: 0.5, r: 0.317 },
  },
  {
    id: "prem-laurel",
    name: "Altın Defne",
    ring: "bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-600",
    preview: "bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-600",
    frameSrc: "/frames/prem-laurel.svg",
    accent: "#f59e0b",
    hole: { cx: 0.5, cy: 0.5, r: 0.324 },
  },
  {
    id: "prem-flame",
    name: "Alev Halkası",
    ring: "bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-300",
    preview: "bg-gradient-to-tr from-red-600 via-orange-500 to-yellow-300",
    frameSrc: "/frames/prem-flame.svg",
    accent: "#f97316",
    hole: { cx: 0.5, cy: 0.5, r: 0.332 },
  },
  {
    id: "prem-ice",
    name: "Buz Tacı",
    ring: "bg-gradient-to-tr from-sky-200 via-sky-400 to-blue-700",
    preview: "bg-gradient-to-tr from-sky-200 via-sky-400 to-blue-700",
    frameSrc: "/frames/prem-ice.svg",
    accent: "#38bdf8",
    hole: { cx: 0.5, cy: 0.5, r: 0.328 },
  },
  {
    id: "prem-galaxy",
    name: "Galaksi Yörüngesi",
    ring: "bg-gradient-to-tr from-indigo-400 via-purple-500 to-sky-400",
    preview: "bg-gradient-to-tr from-indigo-400 via-purple-500 to-sky-400",
    frameSrc: "/frames/prem-galaxy.svg",
    accent: "#818cf8",
    hole: { cx: 0.5, cy: 0.5, r: 0.332 },
  },
];

/** Tema id'sinden tanım (yoksa null). */
export function getPremiumTheme(id: string | null | undefined): PremiumTheme | null {
  if (!id) return null;
  return PREMIUM_THEMES.find((t) => t.id === id) ?? null;
}

/**
 * Çerçevenin kilidi kullanıcı için açık mı?
 * - Rütbe çerçevesi (unlockPoints tanımlı): kullanıcının XP'si eşiğe ulaştıysa açık.
 * - Animasyonlu çerçeve (unlockPoints yok): Ultra Plus (ultraAllowed) gerekir.
 */
export function isThemeUnlocked(
  theme: PremiumTheme,
  points: number,
  ultraAllowed: boolean
): boolean {
  if (theme.unlockPoints !== undefined) return points >= theme.unlockPoints;
  return ultraAllowed;
}

/** Kilitliyken gösterilecek kısa etiket. */
export function themeLockLabel(theme: PremiumTheme): string {
  return theme.unlockPoints !== undefined ? `🔒 ${theme.unlockRank}` : "🔒 Ultra Plus";
}

/**
 * Premium tema varsa avatar çerçevesi için ring sınıfı + glow döndürür.
 * Yoksa boş string (mevcut cinsiyet çerçevesi kullanılmaya devam eder).
 */
export function premiumThemeRing(id: string | null | undefined): string {
  const t = getPremiumTheme(id);
  return t ? `${t.ring} shadow-glow` : "";
}
