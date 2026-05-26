import { supabase } from "@/lib/supabaseClient";

/** Verilen kullanıcı, hedefi engellemiş mi? */
export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { data } = await supabase
    .from("blocked_users")
    .select("id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();
  return !!data;
}

/** Kullanıcıyı engelle. */
export async function blockUser(blockerId: string, blockedId: string) {
  return supabase.from("blocked_users").insert({ blocker_id: blockerId, blocked_id: blockedId });
}

/** Engeli kaldır. */
export async function unblockUser(blockerId: string, blockedId: string) {
  return supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
}

/** Kullanıcının engellediği kişilerin id kümesi (içerik filtrelemek için). */
export async function getBlockedIds(blockerId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("blocked_users")
    .select("blocked_id")
    .eq("blocker_id", blockerId);
  return new Set((data ?? []).map((b) => (b as { blocked_id: string }).blocked_id));
}
