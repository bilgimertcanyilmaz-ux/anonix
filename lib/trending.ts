/**
 * Trend skoru: (beğeni*3) + (yorum*5) + zaman bonusu.
 * Zaman bonusu: son 1 saat +100, son 24 saat +50, son 7 gün +20, daha eski +0.
 */
interface TrendInput {
  like_count: number;
  comment_count: number;
  created_at: string;
}

export function timeBonus(createdAt: string): number {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hours <= 1) return 100;
  if (hours <= 24) return 50;
  if (hours <= 24 * 7) return 20;
  return 0;
}

export function trendScore(item: TrendInput): number {
  return item.like_count * 3 + item.comment_count * 5 + timeBonus(item.created_at);
}

export function sortByTrend<T extends TrendInput>(items: T[]): T[] {
  return [...items].sort((a, b) => trendScore(b) - trendScore(a));
}

/** Feed filtre seçenekleri. */
export type FeedFilter = "new" | "trend" | "likes" | "comments";

export const feedFilters: { value: FeedFilter; label: string }[] = [
  { value: "new", label: "Yeni" },
  { value: "trend", label: "Trend" },
  { value: "likes", label: "En Çok Beğenilen" },
  { value: "comments", label: "En Çok Yorumlanan" },
];
