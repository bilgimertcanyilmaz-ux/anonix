/**
 * Kullanıcı etkileşimini artıran yardımcılar.
 * "Sana özel" feed için basit, sunucusuz bir sezgisel skorlama.
 */

interface FeedItem {
  id: string;
  mood_tag: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

/** Diziden rastgele bir öğe seç. */
export function pickRandom<T>(arr: T[]): T | null {
  return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;
}

/**
 * "Sana Özel" sıralama: kullanıcının ilgilendiği mood etiketlerine ve
 * genel etkileşime göre içerikleri puanlar.
 */
export function personalize<T extends FeedItem>(
  items: T[],
  preferredMoods: string[]
): T[] {
  const moodSet = new Set(preferredMoods);
  return [...items]
    .map((it) => {
      let score = it.like_count * 2 + it.comment_count * 3;
      if (it.mood_tag && moodSet.has(it.mood_tag)) score += 50; // ilgi alanı bonusu
      // hafif çeşitlilik
      score += Math.random() * 10;
      return { it, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.it);
}

/** Kullanıcının beğeni/yorum geçmişinden tercih ettiği mood'ları çıkarır. */
export function inferPreferredMoods(
  interactedMoods: (string | null)[]
): string[] {
  const counts = new Map<string, number>();
  for (const m of interactedMoods) {
    if (!m) continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map((e) => e[0]).slice(0, 5);
}
