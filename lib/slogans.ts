/** Anonix marka sloganları (landing, store, onboarding, paylaşım kartları). */

export const slogans = [
  "Anonim kal. İçini dök.",
  "Kim olduğunu söylemeden konuş.",
  "Gölgedeki düşünceler burada ortaya çıkar.",
  "Anonimliğin yeni sosyal ağı.",
] as const;

export const primarySlogan = slogans[0];

/** Rastgele bir slogan (paylaşım kartları için). */
export function randomSlogan(): string {
  return slogans[Math.floor(Math.random() * slogans.length)];
}
