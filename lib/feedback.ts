import { supabase } from "@/lib/supabaseClient";
import type { FeedbackKind } from "@/types";

/**
 * Geri bildirim / hata / fikir kaydı gönderir.
 * Stage 18: artık /api/feedback üzerinden gönderilir — sunucu DB'ye yazar
 * ve support@anonix.digital adresine e-posta atar.
 * Eski memnuniyet (rating) çağrısı doğrudan DB'ye düşmeye devam eder.
 */
export async function submitFeedback(input: {
  kind: FeedbackKind;
  message?: string;
  rating?: number | null;
  page?: string;
  userId?: string | null;
}): Promise<{ error?: string }> {
  try {
    // Memnuniyet (rating) — eski akış, DB'ye direkt
    if (input.kind === "satisfaction" || input.rating != null) {
      const meta: Record<string, unknown> = {};
      if (typeof navigator !== "undefined") {
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
    }

    // Yeni akış: server endpoint → DB + e-posta
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        type: input.kind,
        message: input.message ?? "",
        page_url:
          input.page ?? (typeof window !== "undefined" ? window.location.href : null),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !json.ok) return { error: json.error || "Geri bildirim gönderilemedi." };
    return {};
  } catch {
    return { error: "Geri bildirim gönderilemedi." };
  }
}
