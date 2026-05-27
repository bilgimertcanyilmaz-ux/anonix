import { supabase } from "@/lib/supabaseClient";
import type { FeedbackKind } from "@/types";

/** Geri bildirim / hata / fikir / memnuniyet kaydı gönderir. Fire-and-forget güvenli. */
export async function submitFeedback(input: {
  kind: FeedbackKind;
  message?: string;
  rating?: number | null;
  page?: string;
  userId?: string | null;
}): Promise<{ error?: string }> {
  try {
    const meta: Record<string, unknown> = {};
    if (typeof navigator !== "undefined") {
      // PII içermeyen, mağaza uyumlu minimal teknik bağlam.
      meta.lang = navigator.language;
      meta.platform = navigator.platform;
    }
    const { error } = await supabase.from("feedback_reports").insert({
      kind: input.kind,
      message: input.message?.trim() || null,
      rating: input.rating ?? null,
      page: input.page ?? (typeof window !== "undefined" ? window.location.pathname : null),
      user_id: input.userId ?? null,
      meta,
    });
    if (error) return { error: error.message };
    return {};
  } catch {
    return { error: "Geri bildirim gönderilemedi." };
  }
}
