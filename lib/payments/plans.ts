import type { SubscriptionType, SubscriptionTier } from "@/types";

export interface PlanDefinition {
  /** Plan id (checkout): plus_monthly | ultra_plus_monthly */
  type: SubscriptionType;
  /** Ödeme sonucu atanacak paket. */
  tier: SubscriptionTier;
  name: string;
  price: number; // TRY — SUNUCU TARAFI SABİT (frontend fiyatına güvenilmez)
  currency: "TRY";
  /** Ay cinsinden süre. */
  durationMonths: number;
  /** Günlük boost hakkı. */
  boosts: number;
  popular?: boolean;
  /** Kart üzerindeki etiket (ör. "En Güçlü"). */
  highlight?: string;
}

/** Aktif satılabilir paketler (yalnızca aylık). */
export const PLANS: Record<string, PlanDefinition> = {
  plus_monthly: {
    type: "plus_monthly",
    tier: "plus",
    name: "Plus",
    price: 49.99,
    currency: "TRY",
    durationMonths: 1,
    boosts: 1,
  },
  ultra_plus_monthly: {
    type: "ultra_plus_monthly",
    tier: "ultra_plus",
    name: "Ultra Plus",
    price: 99.99,
    currency: "TRY",
    durationMonths: 1,
    boosts: 3,
    popular: true,
    highlight: "En Güçlü",
  },
};

/** Geçerli bir plan id'sini PlanDefinition'a çevirir (yoksa null). */
export function getPlan(type: string): PlanDefinition | null {
  return PLANS[type] ?? null;
}

/** Plan başlangıcından bitiş tarihini hesaplar. */
export function computeExpiry(type: string, from = new Date()): Date {
  const months = PLANS[type]?.durationMonths ?? 1;
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}
