/**
 * AI moderasyon altyapısı — şimdilik mock.
 *
 * İleride OpenAI / Anthropic / başka bir moderasyon servisine bağlanabilir.
 * Gerçek entegrasyon SUNUCU TARAFINDA (API route / edge function) yapılmalıdır;
 * API anahtarı asla istemciye konmaz.
 */

export interface AIModerationResult {
  flagged: boolean;
  categories: string[];
  /** 0–1 arası güven/şiddet skoru. */
  score: number;
  provider: string;
}

/**
 * İçeriği AI ile analiz eder (şu an mock yanıt döner).
 *
 * Gerçek bağlantı örneği (sözde kod):
 *   const res = await fetch('/api/moderate', { method:'POST', body: JSON.stringify({ text }) });
 *   return res.json();
 */
export async function analyzeContentWithAI(text: string): Promise<AIModerationResult> {
  // --- MOCK ---
  // Basit bir sezgi: çok kısa metinler güvenli kabul edilir.
  const length = text.trim().length;
  const mockScore = Math.min(0.1, length / 100000);

  return {
    flagged: false,
    categories: [],
    score: mockScore,
    provider: "mock",
  };
}
