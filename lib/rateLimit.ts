import { supabase } from "@/lib/supabaseClient";

/**
 * Merkezi rate-limit yardımcısı.
 *
 * ÖNEMLİ: Asıl (otoritatif) sınırlamalar SUNUCU tarafında DB trigger'larıyla
 * uygulanır (supabase/store_security.sql + golge.sql). Bu modül, kullanıcıya
 * hızlı geri bildirim için istemci tarafı ÖN KONTROL sağlar; atlatılsa bile
 * DB trigger'ları işlemi reddeder.
 */
export interface RateRule {
  table: string;
  column: string;
  max: number;
  windowMs: number;
}

export const RATE_RULES = {
  confession: { table: "confessions", column: "user_id", max: 10, windowMs: 3_600_000 },
  comment: { table: "confession_comments", column: "user_id", max: 30, windowMs: 600_000 },
  message: { table: "messages", column: "sender_id", max: 20, windowMs: 600_000 },
  golge: { table: "golge_posts", column: "user_id", max: 10, windowMs: 3_600_000 },
  report: { table: "reports", column: "reporter_id", max: 5, windowMs: 3_600_000 },
} satisfies Record<string, RateRule>;

export type RateAction = keyof typeof RATE_RULES;

export interface RateResult {
  allowed: boolean;
  message?: string;
}

const BLOCK_MESSAGE = "Çok hızlı işlem yapıyorsun. Lütfen biraz bekleyip tekrar dene.";

/** İstemci ön kontrolü: son pencere içinde kullanıcının kayıt sayısını sayar. */
export async function checkRateLimit(action: RateAction, userId: string): Promise<RateResult> {
  const rule = RATE_RULES[action];
  try {
    const since = new Date(Date.now() - rule.windowMs).toISOString();
    const { count } = await supabase
      .from(rule.table)
      .select("id", { count: "exact", head: true })
      .eq(rule.column, userId)
      .gte("created_at", since);
    if ((count ?? 0) >= rule.max) return { allowed: false, message: BLOCK_MESSAGE };
    return { allowed: true };
  } catch {
    // Ön kontrol başarısızsa engelleme — sunucu trigger'ı yine korur.
    return { allowed: true };
  }
}
