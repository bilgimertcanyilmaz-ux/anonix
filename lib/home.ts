import { supabase } from "@/lib/supabaseClient";
import { sortByTrend } from "@/lib/trending";
import { nonExpiredFilter } from "@/lib/feeds";
import { mergeTasks } from "@/lib/tasks";
import type { ConfessionRecord, GolgePost, DailyTask, UserDailyTask } from "@/types";

const CONF_SELECT = "*, profiles(username, gender, is_anonymous, avatar_url, premium_theme)";
const GOLGE_SELECT = "*, profiles(username, gender, is_anonymous, avatar_url, premium_theme)";

/** Trend itiraflar — son içerikleri çekip trend skoruna göre sıralar. */
export async function fetchTrendingConfessions(limit = 5): Promise<ConfessionRecord[]> {
  const { data, error } = await supabase
    .from("confessions")
    .select(CONF_SELECT)
    .or(nonExpiredFilter())
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return sortByTrend(data as ConfessionRecord[]).slice(0, limit);
}

/**
 * Takip edilen kullanıcıların son itirafları.
 *
 * NOT: Takip sistemi (follows tablosu) henüz yok. Tablo eklenince
 * (follower_id / following_id kolonlarıyla) bu fonksiyon otomatik çalışır.
 * Tablo yoksa sorgu hata döner ve sessizce boş liste döneriz.
 */
export async function fetchFollowedConfessions(
  userId: string,
  limit = 5
): Promise<ConfessionRecord[]> {
  const { data: follows, error: fErr } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (fErr || !follows || follows.length === 0) return [];

  const ids = follows.map((f) => f.following_id as string);
  const { data, error } = await supabase
    .from("confessions")
    .select(CONF_SELECT)
    .in("user_id", ids)
    .or(nonExpiredFilter())
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as ConfessionRecord[];
}

/** Popüler Gölge önerileri (en çok beğenilenler). */
export async function fetchGolgeSuggestions(limit = 4): Promise<GolgePost[]> {
  const { data, error } = await supabase
    .from("golge_posts")
    .select(GOLGE_SELECT)
    .order("like_count", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as GolgePost[];
}

export interface DailyTaskSummary {
  completed: number;
  total: number;
  rewardLeft: number;
}

/** Günlük görev özeti: tamamlanan/toplam + kalan toplam ödül puanı. */
export async function fetchDailyTaskSummary(userId: string): Promise<DailyTaskSummary> {
  const [{ data: defs }, { data: progress }] = await Promise.all([
    supabase.from("daily_tasks").select("*").eq("is_active", true),
    supabase
      .from("user_daily_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("task_date", new Date().toISOString().slice(0, 10)),
  ]);
  const merged = mergeTasks((defs as DailyTask[]) ?? [], (progress as UserDailyTask[]) ?? []);
  const completed = merged.filter((t) => t.is_completed).length;
  const rewardLeft = merged
    .filter((t) => !t.is_completed)
    .reduce((sum, t) => sum + t.reward_points, 0);
  return { completed, total: merged.length, rewardLeft };
}

/** Kullanıcının beğendiği itiraf id'leri (FeedCard liked durumu için). */
export async function fetchLikedConfessionIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("confession_likes")
    .select("confession_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((l) => l.confession_id as string));
}

/** Kullanıcının beğendiği Gölge id'leri. */
export async function fetchLikedGolgeIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("golge_likes")
    .select("golge_post_id")
    .eq("user_id", userId);
  return new Set((data ?? []).map((l) => l.golge_post_id as string));
}
