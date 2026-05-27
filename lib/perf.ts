import { supabase } from "@/lib/supabaseClient";

export type PerfMetric = "slow_query" | "large_image" | "failed_api" | "realtime_drop";

/** Eşikler (ms / byte). Bu değerleri aşan olaylar perf_logs'a yazılır. */
export const PERF_THRESHOLDS = {
  slowQueryMs: 1500,
  largeImageBytes: 2_000_000, // 2 MB
};

/**
 * Bir performans olayını kaydeder. Yalnızca eşiği aşan / gerçek sorunları loglar.
 * Fire-and-forget; akışı asla bloklamaz.
 */
export async function logPerf(
  metric: PerfMetric,
  valueMs: number | null = null,
  detail: Record<string, unknown> = {},
  userId?: string | null
): Promise<void> {
  try {
    await supabase.from("perf_logs").insert({
      metric,
      value_ms: valueMs,
      detail,
      user_id: userId ?? null,
    });
  } catch {
    /* perf log kritik değil */
  }
}

/**
 * Bir async işlemi süre ölçerek çalıştırır; eşik aşılırsa slow_query loglar.
 * Sonucu olduğu gibi döndürür (yan etki yok).
 */
export async function measure<T>(
  label: string,
  fn: () => Promise<T>,
  userId?: string | null
): Promise<T> {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    return await fn();
  } finally {
    const elapsed = Math.round(
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - start
    );
    if (elapsed > PERF_THRESHOLDS.slowQueryMs) {
      void logPerf("slow_query", elapsed, { label }, userId);
    }
  }
}
