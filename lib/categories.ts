/**
 * İtiraf kategorileri (Stage 15).
 * Geriye dönük uyumluluk: kategori değerleri eski `mood_tag` değerleriyle birebir
 * aynıdır; yeni paylaşımlarda hem `category` hem `mood_tag` aynı değere yazılır.
 */
export interface Category {
  /** DB'ye yazılan değer (mood_tag ile uyumlu). */
  value: string;
  emoji: string;
  /** Filtre çubuğunda gösterilen kısa etiket (yoksa value kullanılır). */
  filterLabel?: string;
}

export const CATEGORIES: Category[] = [
  { value: "Aşk", emoji: "❤️" },
  { value: "Pişmanlık", emoji: "😔" },
  { value: "Komik", emoji: "😂" },
  { value: "Korku", emoji: "😱" },
  { value: "Utanç", emoji: "😳" },
  { value: "Dram", emoji: "🎭" },
  { value: "İş Hayatı", emoji: "💼", filterLabel: "İş" },
  { value: "Okul", emoji: "🎓" },
  { value: "Aile", emoji: "👨‍👩‍👧" },
  { value: "Diğer", emoji: "✨" },
];

/** Filtre çubuğu için "Tümü" + tüm kategoriler. */
export const CATEGORY_FILTERS: { value: string | null; label: string }[] = [
  { value: null, label: "Tümü" },
  ...CATEGORIES.map((c) => ({ value: c.value, label: c.filterLabel ?? c.value })),
];

/** Bir kategori/mood değerinin emojisini döndürür (yoksa ✨). */
export function categoryEmoji(value: string | null | undefined): string {
  if (!value) return "";
  return CATEGORIES.find((c) => c.value === value)?.emoji ?? "✨";
}
