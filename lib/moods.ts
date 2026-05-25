/** İtiraf ruh hali (mood) etiketleri. */
export interface MoodTag {
  value: string;
  emoji: string;
}

export const moodTags: MoodTag[] = [
  { value: "Aşk", emoji: "❤️" },
  { value: "Pişmanlık", emoji: "😔" },
  { value: "Komik", emoji: "😂" },
  { value: "Korku", emoji: "😱" },
  { value: "Utanç", emoji: "😳" },
  { value: "Dram", emoji: "🎭" },
  { value: "İş Hayatı", emoji: "💼" },
  { value: "Okul", emoji: "🎓" },
  { value: "Aile", emoji: "👨‍👩‍👧" },
  { value: "Aldatma", emoji: "💔" },
  { value: "Diğer", emoji: "✨" },
];

/** Bir mood etiketinin emojisini döndürür (yoksa boş). */
export function moodEmoji(value: string | null | undefined): string {
  if (!value) return "";
  return moodTags.find((m) => m.value === value)?.emoji ?? "✨";
}
