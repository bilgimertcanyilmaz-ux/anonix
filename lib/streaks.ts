import { supabase } from "@/lib/supabaseClient";

/** Günlük streak'i kaydeder (sunucu RPC; gün içinde idempotent). */
export async function recordDailyStreak(): Promise<{
  changed: boolean;
  streak: number;
  reward?: number;
}> {
  try {
    const { data } = await supabase.rpc("record_daily_streak");
    const res = (data ?? {}) as { changed?: boolean; streak?: number; reward?: number };
    return { changed: !!res.changed, streak: res.streak ?? 0, reward: res.reward };
  } catch {
    return { changed: false, streak: 0 };
  }
}

/** Streak için motivasyon metni. */
export function streakLabel(count: number): string {
  if (count <= 0) return "Bugün giriş yap, streak başlat!";
  if (count < 3) return `${count} günlük streak 🔥`;
  if (count < 7) return `${count} gün! Devam et 🔥`;
  if (count < 30) return `${count} gün — alev aldın 🔥`;
  return `${count} gün — efsane! 👑🔥`;
}
