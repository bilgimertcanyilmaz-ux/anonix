import { CATEGORIES, categoryEmoji } from "@/lib/categories";

/**
 * İtiraf ruh hali (mood) etiketleri.
 * Stage 15: Kategori sistemiyle birleştirildi — kaynak artık lib/categories.ts.
 * Eski `moodTags` / `moodEmoji` API'leri geriye dönük uyumluluk için korunur.
 */
export interface MoodTag {
  value: string;
  emoji: string;
}

export const moodTags: MoodTag[] = CATEGORIES.map((c) => ({
  value: c.value,
  emoji: c.emoji,
}));

/** Bir mood etiketinin emojisini döndürür (yoksa ✨). */
export function moodEmoji(value: string | null | undefined): string {
  return categoryEmoji(value);
}
