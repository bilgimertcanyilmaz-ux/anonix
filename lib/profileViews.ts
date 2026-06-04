import { supabase } from "@/lib/supabaseClient";
import type { ProfileView } from "@/types";

/**
 * Profil görüntüleme kaydı.
 * Dedup, kendi-profili ve hayalet-mod elemesi tamamen RPC'de (sunucu) yapılır —
 * aynı ziyaretçi 1 saat içinde tekrar sayılmaz. İstemci tarafında throttle YOK
 * (eski sessionStorage throttle'ı, RPC başarısız olsa bile bayrak bırakıp sonraki
 * denemeleri engellediği için kaldırıldı).
 */
export async function recordProfileView(profileId: string): Promise<void> {
  try {
    await supabase.rpc("record_profile_view", { p_profile: profileId });
  } catch {
    /* görüntüleme kaydı kritik değil */
  }
}

/**
 * Profil ziyaretçileri (Ultra Plus). Hayalet moddaki ziyaretçiler listede gösterilmez.
 * Anonim ziyaretçiler için kimlik gizlenir (UI'da "Anonim Ziyaretçi").
 */
export async function getProfileViews(profileId: string, limit = 50): Promise<ProfileView[]> {
  const { data } = await supabase
    .from("profile_views")
    .select("*, profiles:viewer_id (username, gender, avatar_url, is_anonymous, ghost_mode, premium_theme)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Hayalet moddaki ziyaretçileri ele
  return ((data as (ProfileView & { profiles?: { ghost_mode?: boolean } | null })[]) ?? []).filter(
    (v) => !v.profiles?.ghost_mode
  );
}
