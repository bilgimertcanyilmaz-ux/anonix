/**
 * Hazır avatar galerisi (public/avatars altındaki PNG'ler).
 * Kullanıcı yükleme yapmaz; bu listeden seçer ve profiles.avatar_url'e kaydedilir.
 */

export const AVATAR_DIR = "/avatars";

/** Galeride sunulan avatar dosya adları (public/avatars/*.png). */
export const AVATAR_FILES: string[] = [
  "profile.png",
  "boy.png",
  "man.png",
  "man-1.png",
  "woman.png",
  "woman-1.png",
  "woman-2.png",
  "woman-3.png",
  "hacker.png",
  "cat.png",
  "dog.png",
  "dog-1.png",
  "bear.png",
  "lion.png",
  "dragon.png",
  "rabbit.png",
  "penguin.png",
  "chicken.png",
  "giraffe.png",
  "meerkat.png",
];

/** Tam avatar URL'leri. */
export const AVATAR_URLS: string[] = AVATAR_FILES.map((f) => `${AVATAR_DIR}/${f}`);

/** Bir avatar URL'sinin galeriye ait geçerli bir avatar olup olmadığı. */
export function isValidAvatarUrl(url: string | null | undefined): boolean {
  return !!url && AVATAR_URLS.includes(url);
}
