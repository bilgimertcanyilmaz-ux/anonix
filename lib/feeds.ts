import { timeBonus } from "@/lib/trending";

/** Gece modu saatleri (00:00–05:00). */
export function isNightHours(d = new Date()): boolean {
  const h = d.getHours();
  return h >= 0 && h < 5;
}

interface HotInput {
  like_count: number;
  comment_count: number;
  created_at: string;
}

/**
 * "Alev Alanlar" skoru — son saatlerdeki hızlı etkileşimi öne çıkarır.
 * Yeni + yüksek etkileşimli içerik en üste gelir.
 */
export function hotScore(item: HotInput): number {
  const engagement = item.like_count * 3 + item.comment_count * 5;
  const bonus = timeBonus(item.created_at); // 1s:100, 24s:50, 7g:20
  // Yeni içerikte etkileşim katlanır
  const recencyMultiplier = bonus >= 100 ? 3 : bonus >= 50 ? 1.5 : 1;
  return engagement * recencyMultiplier + bonus;
}

export function sortByHot<T extends HotInput>(items: T[]): T[] {
  return [...items].sort((a, b) => hotScore(b) - hotScore(a));
}

/** Bugün paylaşılanlar (son 24 saat). */
export function isFromToday(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() <= 24 * 3600 * 1000;
}

/** Genişletilmiş feed sekmeleri. */
export type ExtendedFilter =
  | "new"
  | "following"
  | "hot"
  | "today"
  | "trend"
  | "likes"
  | "comments";

export const extendedFilters: { value: ExtendedFilter; label: string }[] = [
  { value: "new", label: "Yeni" },
  { value: "following", label: "Takip Ettiklerim" },
  { value: "hot", label: "🔥 Alev Alanlar" },
  { value: "today", label: "Bugün Popüler" },
  { value: "trend", label: "Trend" },
  { value: "likes", label: "En Çok Beğenilen" },
  { value: "comments", label: "En Çok Yorumlanan" },
];

/**
 * Kaybolan (süresi dolmuş) itirafları gizlemek için Supabase .or filtresi.
 * is_temporary=false OLAN ya da expires_at gelecekte olan kayıtlar.
 */
export function nonExpiredFilter(): string {
  return `is_temporary.eq.false,expires_at.gt.${new Date().toISOString()}`;
}
