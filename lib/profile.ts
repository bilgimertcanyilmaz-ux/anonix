import type { Gender } from "@/types";

// NOT: Cinsiyet etiketi/çerçeve/rozet yardımcıları lib/gender.ts içindedir.

/** Kayıt formundaki cinsiyet seçenekleri. */
export const genderOptions: { value: Gender; label: string }[] = [
  { value: "male", label: "Erkek" },
  { value: "female", label: "Kadın" },
  { value: "other", label: "Belirtmek istemiyorum" },
];

/** Avatar için kullanıcı adının baş harfleri. */
export function initialsOf(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

/**
 * Plus özelliklerini (örn. mesajlaşma) kullanabilir mi?
 * Plus üyeler VEYA adminler abonelik olmadan tüm Plus özelliklerini kullanır.
 * (Sunucu tarafı RLS de aynı kuralı uygular — bu yalnızca istemci UX kontrolü.)
 */
export function canUsePlusFeatures(
  profile: { is_plus?: boolean | null; role?: string | null } | null | undefined
): boolean {
  return !!profile && (!!profile.is_plus || profile.role === "admin");
}
