import { supabase } from "@/lib/supabaseClient";

/** Growth analytics olay türleri. */
export type AnalyticsEvent =
  | "onboarding_completed"
  | "install_prompt_opened"
  | "install_completed"
  | "referral_shared"
  | "referral_joined"
  | "push_permission_granted"
  | "notification_clicked"
  | "session_duration";

/**
 * Bir analytics olayını kaydeder. Fire-and-forget; asla akışı bloklamaz.
 * Giriş yapılmamışsa userId null geçilir (anon olaylar).
 */
export async function trackEvent(
  event: AnalyticsEvent,
  meta: Record<string, unknown> = {},
  userId?: string | null
): Promise<void> {
  try {
    await supabase.from("analytics_events").insert({
      event,
      meta,
      user_id: userId ?? null,
    });
  } catch {
    /* analytics kritik değil */
  }
}
