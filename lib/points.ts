/**
 * Puan değerleri — veritabanı trigger'larıyla birebir eşleşir.
 * (Sunucu otoritatiftir; bu sabitler yalnızca gösterim/dokümantasyon içindir.)
 */
export const POINTS = {
  confession: 150,
  confessionLike: 6,
  confessionComment: 3,
  golgePost: 200,
  golgeLike: 8,
  golgeComment: 4,
} as const;

export type PointEvent = keyof typeof POINTS;
