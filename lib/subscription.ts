import { supabase } from "@/lib/supabaseClient";
import type { SubscriptionTier } from "@/types";

/**
 * Anonix abonelik & özellik kontrol sistemi (Stage 16).
 * İki paket: Plus (49.99₺) ve Ultra Plus (99.99₺).
 * NOT: Yetki gerçek anlamda DB/RLS + service_role ile uygulanır; buradaki
 * yardımcılar UI/UX kontrolü içindir.
 */

export type FeatureKey =
  | "messaging"
  | "no_ads"
  | "see_likers"
  | "boost"
  | "basic_analytics"
  | "profile_views"
  | "ghost_mode"
  | "plus_lounge"
  | "advanced_analytics"
  | "premium_themes"
  | "profile_themes"
  | "disappearing_messages"
  | "night_area";

/** Plus paketinin erişebildiği özellikler. */
export const PLUS_FEATURES: FeatureKey[] = [
  "messaging",
  "no_ads",
  "see_likers",
  "boost",
  "basic_analytics",
  "profile_themes",
];

/** Ultra Plus paketinin erişebildiği özellikler (Plus dahil). */
export const ULTRA_FEATURES: FeatureKey[] = [
  ...PLUS_FEATURES,
  "profile_views",
  "ghost_mode",
  "plus_lounge",
  "advanced_analytics",
  "premium_themes",
  "disappearing_messages",
  "night_area",
];

/** Yalnızca Ultra Plus'a özel özellikler (mesaj/erişim ayrımı için). */
export const ULTRA_ONLY_FEATURES: FeatureKey[] = ULTRA_FEATURES.filter(
  (f) => !PLUS_FEATURES.includes(f)
);

type ProfileLike = {
  subscription_tier?: string | null;
  is_plus?: boolean | null;
  role?: string | null;
} | null | undefined;

/**
 * Profilin geçerli paketini döndürür.
 * - admin → ultra_plus (tüm özellikler)
 * - subscription_tier doluysa onu kullan
 * - değilse is_plus'tan türet (geriye dönük uyumluluk)
 */
export function getEffectiveTier(profile: ProfileLike): SubscriptionTier {
  if (!profile) return "free";
  if (profile.role === "admin") return "ultra_plus";
  // is_plus açıkça false ise (süresi dolmuş / hiç alınmamış) paket free'dir —
  // subscription_tier alanı eski/stale kalmış olsa bile premium gösterilmez.
  if (profile.is_plus === false) return "free";
  const tier = profile.subscription_tier;
  if (tier === "ultra_plus") return "ultra_plus";
  if (tier === "plus") return "plus";
  return profile.is_plus ? "plus" : "free";
}

/** Plus veya üzeri mi? (mesajlaşma vb. için) */
export function isPlusOrAbove(profile: ProfileLike): boolean {
  const t = getEffectiveTier(profile);
  return t === "plus" || t === "ultra_plus";
}

/** Ultra Plus mı? */
export function isUltraPlus(profile: ProfileLike): boolean {
  return getEffectiveTier(profile) === "ultra_plus";
}

/** Bir özelliğe erişebilir mi? */
export function canUseFeature(profile: ProfileLike, feature: FeatureKey): boolean {
  const tier = getEffectiveTier(profile);
  if (tier === "ultra_plus") return ULTRA_FEATURES.includes(feature);
  if (tier === "plus") return PLUS_FEATURES.includes(feature);
  return false;
}

/** Bir özelliğin gerektirdiği minimum paket. */
export function featureRequirement(feature: FeatureKey): SubscriptionTier {
  if (PLUS_FEATURES.includes(feature)) return "plus";
  if (ULTRA_FEATURES.includes(feature)) return "ultra_plus";
  return "ultra_plus";
}

/** Sunucudan kullanıcının paketini getirir. */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_tier, is_plus, role")
    .eq("id", userId)
    .maybeSingle();
  return getEffectiveTier(data as ProfileLike);
}

/** Günlük boost hakkı (UI gösterimi). */
export function boostQuota(tier: SubscriptionTier): number {
  if (tier === "ultra_plus") return 3;
  if (tier === "plus") return 1;
  return 0;
}

// --- UI metinleri (Türkçe) ---------------------------------------------------

export const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Free",
  plus: "Plus",
  ultra_plus: "Ultra Plus",
};

export const FEATURE_REQUIRES_PLUS = "Bu özellik Plus veya üzeri gerektirir.";
export const FEATURE_REQUIRES_ULTRA = "Bu özellik Ultra Plus gerektirir.";

/** Bir özellik için uygun kilit mesajı. */
export function featureLockMessage(feature: FeatureKey): string {
  return featureRequirement(feature) === "ultra_plus"
    ? FEATURE_REQUIRES_ULTRA
    : FEATURE_REQUIRES_PLUS;
}

// --- Pricing / karşılaştırma verisi -----------------------------------------

/** Pricing kartlarında gösterilecek özellik listeleri. */
export const PLUS_PERKS = [
  "Özel mesajlaşma",
  "Reklamsız kullanım",
  "Plus rozeti",
  "Premium profil çerçevesi",
  "Yorumlarda hafif öne çıkma",
  "Günlük 1 boost hakkı",
  "Temel profil istatistikleri",
  "Kim beğendi görebilme",
];

export const ULTRA_PERKS = [
  "Plus’taki her şey",
  "Profilimi kim görüntüledi",
  "Hayalet Mod",
  "Plus özel odaları",
  "Gelişmiş istatistikler",
  "Premium profil temaları",
  "Glow efektleri",
  "Günlük 3 boost hakkı",
  "Kaybolan mesajlar",
  "Özel gece alanı",
  "Gelişmiş gizlilik",
  "Yorumlarda daha güçlü öne çıkma",
  "Ultra Plus rozeti",
];

/** Free | Plus | Ultra Plus karşılaştırma satırları. */
export const COMPARISON_ROWS: { feature: string; free: boolean; plus: boolean; ultra: boolean }[] = [
  { feature: "Özel mesajlaşma", free: false, plus: true, ultra: true },
  { feature: "Reklamsız kullanım", free: false, plus: true, ultra: true },
  { feature: "Kim beğendi", free: false, plus: true, ultra: true },
  { feature: "Premium profil çerçevesi", free: false, plus: true, ultra: true },
  { feature: "Günlük boost", free: false, plus: true, ultra: true },
  { feature: "Temel istatistikler", free: false, plus: true, ultra: true },
  { feature: "Profilimi kim görüntüledi", free: false, plus: false, ultra: true },
  { feature: "Hayalet Mod", free: false, plus: false, ultra: true },
  { feature: "Plus özel odaları", free: false, plus: false, ultra: true },
  { feature: "Gelişmiş istatistikler", free: false, plus: false, ultra: true },
  { feature: "Premium temalar & glow", free: false, plus: false, ultra: true },
  { feature: "Kaybolan mesajlar", free: false, plus: false, ultra: true },
  { feature: "Özel gece alanı", free: false, plus: false, ultra: true },
];
