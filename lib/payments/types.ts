import type { PlanDefinition } from "@/lib/payments/plans";

export interface CheckoutInput {
  plan: PlanDefinition;
  user: { id: string; email: string; username: string };
  /** iyzico callback'in döneceği mutlak URL. */
  callbackUrl: string;
  /** Ödeme kaydını eşlemek için benzersiz referans. */
  conversationId: string;
}

export interface CheckoutResult {
  ok: boolean;
  /** Yönlendirilecek ödeme sayfası (iyzico CF). */
  paymentPageUrl?: string;
  /** Gömülebilir CF içeriği (alternatif). */
  checkoutFormContent?: string;
  /** Sağlayıcı tarafı token (callback'te doğrulama için). */
  token?: string;
  error?: string;
}

export interface VerifyResult {
  ok: boolean;
  success: boolean;
  paymentId?: string;
  /** Sağlayıcıdan dönen ham yanıt (loglanır). */
  raw?: unknown;
  error?: string;
}

/**
 * Modüler ödeme sağlayıcı arayüzü.
 * iyzico bugün; Stripe ileride aynı arayüzü uygular.
 */
export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Callback/webhook token'ından ödemeyi doğrular. */
  verify(token: string): Promise<VerifyResult>;
}
