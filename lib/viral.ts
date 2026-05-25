import { publicEnv } from "@/lib/env";

/** Bir içerik için dinamik OG (paylaşım) görseli URL'i. */
export function ogImageUrl(params: {
  type: "confession" | "golge" | "profile";
  text?: string;
  mood?: string;
}): string {
  const q = new URLSearchParams({ type: params.type });
  if (params.text) q.set("text", params.text.slice(0, 180));
  if (params.mood) q.set("mood", params.mood);
  return `${publicEnv.siteUrl}/api/og?${q.toString()}`;
}

/** Paylaşılacak içerik linki. */
export function contentShareUrl(type: "confession" | "golge", id: string): string {
  return `${publicEnv.siteUrl}/${type === "confession" ? "confessions" : "golge"}/${id}`;
}

/** Viral paylaşım başlığı (örn. "Bugün Gölge'de bunu gördüm…"). */
export function viralHeadline(type: "confession" | "golge"): string {
  return type === "golge"
    ? "Bugün Gölge'de bunu gördüm…"
    : "Bugün Anonix'te bu itirafı okudum…";
}
