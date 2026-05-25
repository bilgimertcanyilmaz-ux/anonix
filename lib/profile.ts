import type { Gender } from "@/types";

/** Cinsiyetin Türkçe ekran metni. */
export const genderLabel: Record<Gender, string> = {
  male: "Erkek",
  female: "Kadın",
  other: "Belirtmek istemiyorum",
};

/** Kayıt formundaki cinsiyet seçenekleri. */
export const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Belirtmek istemiyorum" },
];

/**
 * Cinsiyete göre profil fotoğrafı çerçevesi sınıfı.
 * - erkek: mavi
 * - kadın: pembe
 * - belirtmek istemiyorum: gökkuşağı gradient
 */
export const genderFrameClass: Record<Gender, string> = {
  male: "bg-gradient-to-br from-accent-400 to-accent-600",
  female: "bg-gradient-to-br from-pink-400 to-rose-600",
  other:
    "bg-[conic-gradient(from_180deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6,#ec4899,#ef4444)]",
};

/** Profil rozeti için kısa rütbe açıklaması (yoksa boş). */
export function initialsOf(username: string): string {
  return username.slice(0, 2).toUpperCase();
}
