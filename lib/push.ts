import { supabase } from "@/lib/supabaseClient";

/**
 * Push bildirim altyapısı — şimdilik MOCK.
 * Gerçek Web Push için: VAPID anahtarları + Service Worker + sunucu tarafı gönderim
 * (web-push paketi) eklenir. Burada yalnızca abonelik kaydı tutulur.
 */

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

/** Mock abonelik: kullanıcı için bir endpoint kaydı oluşturur. */
export async function subscribeToPush(userId: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const endpoint = `mock://anonix/${userId}/${Date.now()}`;
    const { error } = await supabase
      .from("push_subscriptions")
      .insert({ user_id: userId, endpoint });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}
