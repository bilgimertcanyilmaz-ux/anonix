import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { iyzicoProvider } from "@/lib/payments/iyzico";
import type { PaymentProvider, CheckoutInput, VerifyResult } from "@/lib/payments/types";
import { getPlan, computeExpiry } from "@/lib/payments/plans";
import type { SubscriptionType } from "@/types";

/**
 * Aktif ödeme sağlayıcısı. İleride env ile Stripe'a geçilebilir:
 *   PAYMENT_PROVIDER=stripe -> stripeProvider
 */
export const provider: PaymentProvider = iyzicoProvider;

/** Ödeme/checkout başlatır (provider'a delege eder). */
export async function createPayment(input: CheckoutInput) {
  return provider.createCheckout(input);
}

/** Sağlayıcı token'ından ödemeyi doğrular (server-side). */
export async function verifyPayment(token: string): Promise<VerifyResult> {
  return provider.verify(token);
}

/**
 * Ödeme başarılıysa aboneliği aktifleştirir (service_role ile — RLS dışı).
 * is_plus / plus_expires_at yalnızca burada (sunucuda) set edilir.
 */
export async function activateSubscription(params: {
  userId: string;
  type: SubscriptionType;
  providerName: string;
  providerSubscriptionId?: string | null;
}) {
  const plan = getPlan(params.type);
  if (!plan) throw new Error("Geçersiz plan.");

  const admin = getSupabaseAdmin();
  const expiresAt = computeExpiry(params.type);

  // Profili Plus/Ultra Plus yap (s6_profile_badges trigger'ı rozet + bildirim üretir)
  // subscription_tier + plus_boosts pakete göre ayarlanır.
  await admin
    .from("profiles")
    .update({
      is_plus: true,
      subscription_tier: plan.tier,
      plus_boosts: plan.boosts,
      plus_expires_at: expiresAt.toISOString(),
      subscription_type: params.type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.userId);

  // Abonelik kaydı
  await admin.from("subscriptions").insert({
    user_id: params.userId,
    provider: params.providerName,
    provider_subscription_id: params.providerSubscriptionId ?? null,
    subscription_type: params.type,
    status: "active",
    expires_at: expiresAt.toISOString(),
  });

  // Satın alma bildirimi
  await admin.from("notifications").insert({
    user_id: params.userId,
    actor_id: params.userId,
    type: "plus",
    entity_type: "plus",
    message: `Anonix ${plan.name} aktif! 👑`,
  });

  return { expiresAt };
}

/** Aboneliği iptal eder (mevcut süre dolana kadar Plus devam eder). */
export async function cancelSubscription(userId: string) {
  const admin = getSupabaseAdmin();
  await admin
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("status", "active");
}

/** Abonelik durumunu kontrol eder; süresi dolduysa Plus'ı kapatır. */
export async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("is_plus, plus_expires_at")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return false;
  const expired =
    data.plus_expires_at != null && new Date(data.plus_expires_at) < new Date();

  if (data.is_plus && expired) {
    await admin
      .from("profiles")
      .update({
        is_plus: false,
        subscription_tier: "free",
        plus_boosts: 0,
        subscription_type: null,
      })
      .eq("id", userId);
    await admin
      .from("subscriptions")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "active");
    return false;
  }
  return Boolean(data.is_plus);
}
