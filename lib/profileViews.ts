import { supabase } from "@/lib/supabaseClient";
import type { ProfileView } from "@/types";

/**
 * Profil görüntüleme kaydı (RPC — kendi profilini/ghost/spam durumlarını sunucu eler).
 * Aynı oturumda tekrar tetiklememek için sessionStorage ile throttle edilir.
 */
export async function recordProfileView(profileId: string): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      const key = `anonix-pv-${profileId}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    }
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
