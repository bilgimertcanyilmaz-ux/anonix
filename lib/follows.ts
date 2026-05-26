import { supabase } from "@/lib/supabaseClient";

/** Verilen kullanıcı, hedefi takip ediyor mu? */
export async function isFollowing(followerId: string, targetId: string): Promise<boolean> {
  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", targetId)
    .maybeSingle();
  return !!data;
}

/** Takip et (RLS: follower_id = auth.uid()). */
export async function followUser(followerId: string, targetId: string) {
  return supabase.from("follows").insert({ follower_id: followerId, following_id: targetId });
}

/** Takipten çık. */
export async function unfollowUser(followerId: string, targetId: string) {
  return supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", targetId);
}

export interface FollowCounts {
  followers: number;
  following: number;
}

/** Bir kullanıcının takipçi ve takip ettiği sayıları. */
export async function getFollowCounts(userId: string): Promise<FollowCounts> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  return { followers: followers ?? 0, following: following ?? 0 };
}
