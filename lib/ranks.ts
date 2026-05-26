/**
 * XP / Rütbe sistemi (zorlaştırılmış).
 * points alanı XP olarak kullanılır. Sunucudaki anonix_rank() ile birebir eşleşir.
 */
export interface RankTier {
  rank: string;
  min: number;
  icon: string;
}

export const rankTiers: RankTier[] = [
  { rank: "Sessiz Ruh", min: 0, icon: "🌑" },
  { rank: "Yeni İtirafçı", min: 1000, icon: "🌱" },
  { rank: "Gizli Yazar", min: 3000, icon: "🖋️" },
  { rank: "Gece Yolcusu", min: 7500, icon: "🌙" },
  { rank: "Gölge Sakini", min: 15000, icon: "🌫️" },
  { rank: "Karanlık Kalem", min: 30000, icon: "🪶" },
  { rank: "Anonim Usta", min: 60000, icon: "🎭" },
  { rank: "Viral Ruh", min: 120000, icon: "⚡" },
  { rank: "Efsane İtirafçı", min: 250000, icon: "🔥" },
  { rank: "İtiraf Kralı", min: 500000, icon: "👑" },
  { rank: "Gölge Efsanesi", min: 1000000, icon: "🏆" },
];

/** XP'ye karşılık gelen mevcut rütbe tier'ı. */
export function getRankByXP(points: number): RankTier {
  let result = rankTiers[0];
  for (const tier of rankTiers) {
    if (points >= tier.min) result = tier;
  }
  return result;
}

/** Bir sonraki rütbe tier'ı (en üstteyse null). */
export function getNextRank(points: number): RankTier | null {
  const current = getRankByXP(points);
  const idx = rankTiers.findIndex((t) => t.rank === current.rank);
  return idx >= 0 && idx < rankTiers.length - 1 ? rankTiers[idx + 1] : null;
}

/** Mevcut tier içindeki ilerleme yüzdesi (0-100). En üst rütbede 100. */
export function getRankProgress(points: number): number {
  const current = getRankByXP(points);
  const next = getNextRank(points);
  if (!next) return 100;
  const span = next.min - current.min;
  if (span <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((points - current.min) / span) * 100)));
}

/** Sonraki rütbeye kalan XP (en üstteyse 0). */
export function getRemainingXP(points: number): number {
  const next = getNextRank(points);
  return next ? Math.max(0, next.min - points) : 0;
}

/** Puana (XP) karşılık gelen rütbe adı. */
export function rankForPoints(points: number): string {
  return getRankByXP(points).rank;
}

/** Rütbe adına karşılık gelen ikon. */
export function rankIcon(rank: string): string {
  return rankTiers.find((t) => t.rank === rank)?.icon ?? "🌑";
}
