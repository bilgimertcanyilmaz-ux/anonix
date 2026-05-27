import { supabase } from "@/lib/supabaseClient";
import { trendScore } from "@/lib/trending";
import type { ConfessionRecord } from "@/types";

/** Etkileşim tipi → ağırlık. */
export const INTERACTION_WEIGHTS = {
  view: 1,
  like: 3,
  comment: 5,
  follow: 8,
  share: 10,
} as const;

export type InteractionType = keyof typeof INTERACTION_WEIGHTS;

/**
 * Bir etkileşimi kaydeder (kişiselleştirme için). Sessizce başarısız olur —
 * kritik akışları (beğeni/yorum vb.) asla bloklamaz.
 */
export async function trackInteraction(params: {
  userId: string | null | undefined;
  entityType: string;
  entityId: string;
  type: InteractionType;
  moodTag?: string | null;
}): Promise<void> {
  if (!params.userId) return;
  try {
    await supabase.from("user_interactions").insert({
      user_id: params.userId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      mood_tag: params.moodTag ?? null,
      interaction_type: params.type,
      weight: INTERACTION_WEIGHTS[params.type],
    });
  } catch {
    /* kişiselleştirme kritik değil */
  }
}

export interface MoodPreferences {
  /** mood_tag → toplam ağırlık */
  byMood: Record<string, number>;
  /** en çok etkileşim verilen mood_tag */
  topMood: string | null;
}

/** Kullanıcının mood_tag bazlı etkileşim tercihleri. */
export async function getUserMoodPreferences(userId: string): Promise<MoodPreferences> {
  const { data } = await supabase
    .from("user_interactions")
    .select("mood_tag, weight")
    .eq("user_id", userId)
    .not("mood_tag", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);

  const byMood: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    const m = (r as { mood_tag: string | null }).mood_tag;
    if (!m) return;
    byMood[m] = (byMood[m] ?? 0) + ((r as { weight: number }).weight ?? 1);
  });

  let topMood: string | null = null;
  let max = 0;
  for (const [m, w] of Object.entries(byMood)) {
    if (w > max) {
      max = w;
      topMood = m;
    }
  }
  return { byMood, topMood };
}

/** Kullanıcının takip ettiği kullanıcı id'leri. */
export async function getFollowingIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  return new Set((data ?? []).map((f) => (f as { following_id: string }).following_id));
}

/** Yenilik bonusu: son 1s +30, 24s +15, 7g +5. */
function recencyBonus(createdAt: string): number {
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (hours <= 1) return 30;
  if (hours <= 24) return 15;
  if (hours <= 24 * 7) return 5;
  return 0;
}

/**
 * personalized_score = trend_score + mood_match_bonus + following_bonus + recency_bonus
 * - mood_match_bonus: en çok etkileşilen mood ise +50
 * - following_bonus: takip edilen kullanıcı (ve anonim değilse) +30
 * - recency_bonus: yenilik
 */
export function scoreConfession(
  c: ConfessionRecord,
  topMood: string | null,
  followingIds: Set<string>
): number {
  let score = trendScore({
    like_count: c.like_count,
    comment_count: c.comment_count,
    created_at: c.created_at,
  });
  // Kullanıcının en çok etkileşim verdiği kategori/mood ise öne çıkar (+50).
  // Kategori değeri mood_tag ile uyumludur; ikisinden biri eşleşirse yeterli.
  if (topMood && (c.mood_tag === topMood || c.category === topMood)) score += 50;
  if (!c.is_anonymous && followingIds.has(c.user_id)) score += 30;
  score += recencyBonus(c.created_at);
  return score;
}

/** Verilen itirafları kişiselleştirilmiş skora göre sıralar. */
export function getPersonalizedConfessions(
  rows: ConfessionRecord[],
  prefs: MoodPreferences,
  followingIds: Set<string>
): ConfessionRecord[] {
  return [...rows].sort(
    (a, b) =>
      scoreConfession(b, prefs.topMood, followingIds) -
      scoreConfession(a, prefs.topMood, followingIds)
  );
}

/**
 * Giriş yapan kullanıcı için kişiselleştirilmiş Keşfet akışı.
 * Tercihler + takip listesi çekilip skorla sıralanır.
 */
export async function getExploreFeed(
  userId: string,
  rows: ConfessionRecord[]
): Promise<ConfessionRecord[]> {
  const [prefs, following] = await Promise.all([
    getUserMoodPreferences(userId),
    getFollowingIds(userId),
  ]);
  return getPersonalizedConfessions(rows, prefs, following);
}
