import { supabase } from "@/lib/supabaseClient";
import type { FeatureFlag, FeatureKey } from "@/types";

/**
 * Özellik bayrakları (feature flags).
 * - DB'deki feature_flags tablosundan okunur (herkes okuyabilir; admin değiştirir).
 * - Kısa süreli bellek içi cache ile gereksiz sorgu önlenir.
 * - Hata durumunda güvenli varsayılana döner (DEFAULTS).
 */

/** DB'ye ulaşılamazsa kullanılacak güvenli varsayılanlar. */
const DEFAULTS: Record<FeatureKey, boolean> = {
  beta_mode: false,
  push_notifications: false,
  ai_moderation: true,
  ghost_mode: true,
  viral_feed: true,
  onboarding_v2: true,
  satisfaction_popup: true,
  referral_program: true,
};

const CACHE_TTL_MS = 60_000;
let cache: { at: number; flags: Record<string, FeatureFlag> } | null = null;

/** Tüm bayrakları (cache'li) getirir. */
export async function getAllFlags(force = false): Promise<Record<string, FeatureFlag>> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.flags;
  }
  try {
    const { data, error } = await supabase.from("feature_flags").select("*");
    if (error || !data) throw error;
    const flags: Record<string, FeatureFlag> = {};
    for (const f of data as FeatureFlag[]) flags[f.key] = f;
    cache = { at: Date.now(), flags };
    return flags;
  } catch {
    return cache?.flags ?? {};
  }
}

/** Bir bayrağın açık olup olmadığını döndürür (yoksa güvenli varsayılan). */
export async function isFeatureEnabled(key: FeatureKey): Promise<boolean> {
  const flags = await getAllFlags();
  const flag = flags[key];
  if (!flag) return DEFAULTS[key] ?? false;
  return flag.enabled;
}

/** Bayrak kaydını (varsa) döndürür. */
export async function getFeatureFlag(key: FeatureKey): Promise<FeatureFlag | null> {
  const flags = await getAllFlags();
  return flags[key] ?? null;
}

/** Admin: bir bayrağı aç/kapat. */
export async function setFeatureFlag(key: FeatureKey, enabled: boolean): Promise<{ error?: string }> {
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq("key", key);
  cache = null; // cache'i geçersiz kıl
  if (error) return { error: error.message };
  return {};
}

/** Cache'i elle temizle (admin değişiklikleri sonrası). */
export function clearFlagCache(): void {
  cache = null;
}
