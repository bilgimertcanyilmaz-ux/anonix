import { publicEnv } from "@/lib/env";

/** Kullanıcının referral kodundan davet linki üretir. */
export function referralLink(code: string): string {
  return `${publicEnv.siteUrl}/register?ref=${encodeURIComponent(code)}`;
}

/** Paylaşım metni (sosyal kanallar için). */
export function referralShareText(code: string): string {
  return `Anonix'te anonim itirafları keşfet! Davet linkimle katıl, ikimiz de puan kazanalım 👀\n${referralLink(code)}`;
}

/** Sosyal paylaşım URL'leri. */
export function shareTargets(text: string, url: string) {
  const t = encodeURIComponent(text);
  const u = encodeURIComponent(url);
  return {
    whatsapp: `https://wa.me/?text=${t}`,
    twitter: `https://twitter.com/intent/tweet?text=${t}`,
    telegram: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}`,
  };
}

export const REFERRAL_REWARDS = {
  referrer: 250,
  referred: 100,
};
