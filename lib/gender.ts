import type { Gender } from "@/types";

/**
 * Cinsiyet görünürlüğü yardımcıları.
 *
 * ÖNEMLİ KURAL: Anonimlik cinsiyeti GİZLEMEZ. Kullanıcı anonim paylaşsa bile
 * cinsiyet etiketi/çerçevesi her zaman görünür; yalnızca kullanıcı adı/kimliği gizlenir.
 */

/**
 * Gelen değeri güvenli bir Gender'a indirger.
 * Hem kanonik (male/female/other) hem Türkçe/lowercase varyantları kabul eder;
 * null/bilinmeyen → "other".
 */
export function normalizeGender(gender: Gender | string | null | undefined): Gender {
  if (!gender) return "other";
  const g = String(gender).trim().toLocaleLowerCase("tr");
  if (g === "male" || g === "erkek" || g === "e" || g === "bay") return "male";
  if (g === "female" || g === "kadın" || g === "kadin" || g === "k" || g === "bayan") return "female";
  return "other"; // other, diğer, belirtmek istemiyorum, vb.
}

/** Cinsiyetin kısa ekran metni (rozet/etiket için). */
export function getGenderLabel(gender: Gender | string | null | undefined): string {
  const g = normalizeGender(gender);
  if (g === "male") return "Erkek";
  if (g === "female") return "Kadın";
  return "Belirtmek istemiyor";
}

/**
 * Cinsiyete göre avatar çerçevesi sınıfı (gradient arka plan).
 * - erkek: mavi
 * - kadın: pembe
 * - belirtmek istemiyor: gökkuşağı gradient
 */
export function getGenderFrameClass(gender: Gender | string | null | undefined): string {
  const g = normalizeGender(gender);
  if (g === "male") return "bg-gradient-to-br from-sky-400 to-blue-600";
  if (g === "female") return "bg-gradient-to-br from-pink-400 to-rose-600";
  return "bg-[conic-gradient(from_180deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#8b5cf6,#ec4899,#ef4444)]";
}

/**
 * Cinsiyet rozeti sınıfı (küçük, premium chip — karanlık temaya uygun).
 */
export function getGenderBadgeClass(gender: Gender | string | null | undefined): string {
  const g = normalizeGender(gender);
  if (g === "male") return "bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-400/30";
  if (g === "female") return "bg-pink-500/15 text-pink-300 ring-1 ring-inset ring-pink-400/30";
  return "bg-violet-500/15 text-violet-200 ring-1 ring-inset ring-violet-400/30";
}
