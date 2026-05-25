/**
 * Rütbe sistemi — veritabanındaki anonix_rank() fonksiyonuyla birebir eşleşir.
 * (Sunucu otoritatiftir; bu sadece istemci tarafı gösterim içindir.)
 */
export interface RankTier {
  rank: string;
  min: number;
  icon: string;
}

export const rankTiers: RankTier[] = [
  { rank: "Sessiz Ruh", min: 0, icon: "🌑" },
  { rank: "Gizli Yazar", min: 1000, icon: "🖋️" },
  { rank: "Gece İtirafçısı", min: 5000, icon: "🌙" },
  { rank: "Karanlık Kalem", min: 15000, icon: "🪶" },
  { rank: "Anonim Efsane", min: 50000, icon: "🔥" },
  { rank: "İtiraf Kralı", min: 100000, icon: "👑" },
];

/** Puana karşılık gelen rütbe adını döndürür. */
export function rankForPoints(points: number): string {
  let result = rankTiers[0].rank;
  for (const tier of rankTiers) {
    if (points >= tier.min) result = tier.rank;
  }
  return result;
}

/** Rütbe adına karşılık gelen ikon. */
export function rankIcon(rank: string): string {
  return rankTiers.find((t) => t.rank === rank)?.icon ?? "🌑";
}
