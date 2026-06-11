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

/** Kategoriye özgü accent renkleri — kart şeridi + mood çipi için. */
export interface MoodAccent {
  /** Ana renk (şerit/çip metni). */
  a: string;
  /** Gradyan ikinci rengi. */
  b: string;
}

/* Renkler her iki temada da okunur olacak şekilde orta tonlardan seçildi
   (açık temada beyaz kart üzerinde, koyu temada cam kart üzerinde). */
const MOOD_ACCENTS: Record<string, MoodAccent> = {
  "Aşk": { a: "#ec4899", b: "#db2777" },
  "Fantezi": { a: "#fb7185", b: "#f97316" },
  "Pişmanlık": { a: "#f59e0b", b: "#d97706" },
  "Komik": { a: "#eab308", b: "#ca8a04" },
  "Korku": { a: "#6366f1", b: "#4f46e5" },
  "Utanç": { a: "#a855f7", b: "#9333ea" },
  "Dram": { a: "#a855f7", b: "#7c3aed" },
  "İş Hayatı": { a: "#0ea5e9", b: "#0284c7" },
  "Okul": { a: "#14b8a6", b: "#0d9488" },
  "Aile": { a: "#10b981", b: "#059669" },
  "Aldatma": { a: "#ef4444", b: "#dc2626" },
};

/** Mood etiketi için accent renkleri (bilinmiyorsa marka moru). */
export function moodAccent(value: string | null | undefined): MoodAccent {
  return (value && MOOD_ACCENTS[value]) || { a: "#a855f7", b: "#7c3aed" };
}
