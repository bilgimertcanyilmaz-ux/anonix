import { supabase } from "@/lib/supabaseClient";
import { getSubscriptionTier, boostQuota } from "@/lib/subscription";
import type { BoostStatus, Profile } from "@/types";

/** Bir paylaşımın şu an boost'lu olup olmadığı. */
export function isBoosted(boostedUntil: string | null | undefined): boolean {
  return !!boostedUntil && new Date(boostedUntil) > new Date();
}

/** Kullanıcının bugünkü boost durumu (kota/kullanım/kalan). */
export async function getBoostStatus(profile: Profile | null | undefined): Promise<BoostStatus> {
  const isAdmin = profile?.role === "admin";
  const quota = isAdmin ? 3 : boostQuota(getSubscriptionTier(profile));
  if (!profile || quota === 0) return { quota, used: 0, remaining: 0 };

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("boost_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .gte("created_at", startOfDay.toISOString());

  const used = count ?? 0;
  return { quota, used, remaining: Math.max(0, quota - used) };
}

/** Kendi paylaşımını boost'lar (server-side kota kontrolü RPC ile). */
export async function boostConfession(
  confessionId: string
): Promise<{ ok: boolean; remaining?: number; error?: string }> {
  const { data, error } = await supabase.rpc("boost_confession", { p_confession: confessionId });
  if (error) return { ok: false, error: error.message };
  const res = (data ?? {}) as { ok?: boolean; remaining?: number };
  return { ok: !!res.ok, remaining: res.remaining };
}
