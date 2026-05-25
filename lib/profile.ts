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
