import type { SubscriptionType } from "@/types";

export interface PlanDefinition {
  type: SubscriptionType;
  name: string;
  price: number; // TRY
  currency: "TRY";
  /** Ay cinsinden süre. */
  durationMonths: number;
  popular?: boolean;
}

export const PLANS: Record<SubscriptionType, PlanDefinition> = {
  monthly: {
    type: "monthly",
    name: "Plus Aylık",
    price: 49.99,
    currency: "TRY",
    durationMonths: 1,
  },
  yearly: {
    type: "yearly",
    name: "Plus Yıllık",
    price: 399.99,
    currency: "TRY",
    durationMonths: 12,
    popular: true,
  },
};

export function getPlan(type: string): PlanDefinition | null {
  return type === "monthly" || type === "yearly" ? PLANS[type] : null;
}

/** Plan başlangıcından bitiş tarihini hesaplar. */
export function computeExpiry(type: SubscriptionType, from = new Date()): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + PLANS[type].durationMonths);
  return d;
}

/** Plus avantajları (UI için ortak liste). */
export const PLUS_PERKS = [
  "Özel mesaj gönderme",
  "Premium profil çerçeveleri",
  "Reklamsız kullanım",
  "Özel rozet",
  "Gelişmiş gizlilik",
  "Öncelikli destek",
  "Gelecek premium özellikler",
];
