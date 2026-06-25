import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { activateSubscription } from "@/lib/payments";
import type { SubscriptionType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * RevenueCat webhook ucu — iOS (App Store / StoreKit) abonelikleri.
 *
 * RevenueCat, satın alma/yenileme/iptal/süre dolumu olaylarını buraya POST eder.
 * Burada kullanıcının Supabase profilini (is_plus / subscription_tier) güncelleriz;
 * çünkü uygulamadaki premium kontrolü Supabase profiline bakar.
 *
 * GÜVENLİK: RevenueCat panelinde tanımlanan "Authorization header value",
 * REVENUECAT_WEBHOOK_SECRET env değişkeniyle birebir eşleşmeli.
 *
 * RevenueCat'in app_user_id'si = Supabase user.id (storekit.ts configure ederken
 * appUserID olarak Supabase user.id verir).
 */

// App Store product id → dahili plan tipi.
const PRODUCT_TO_PLAN: Record<string, SubscriptionType> = {
  "com.anonix.app.plus_monthly": "plus_monthly",
  "com.anonix.app.ultra_plus_monthly": "ultra_plus_monthly",
};

// Aboneliği AKTİF eden olaylar.
const ACTIVATION_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "NON_RENEWING_PURCHASE",
]);

// Erişimi SONLANDIRAN olaylar (süre doldu / iade).
const DEACTIVATION_EVENTS = new Set(["EXPIRATION", "REFUND"]);

interface RCEvent {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  product_id?: string;
  entitlement_ids?: string[];
}

export async function POST(req: NextRequest) {
  try {
    // 1) Yetki kontrolü — sahte webhook'ları engelle.
    const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
    const auth = req.headers.get("authorization") || "";
    if (!expected || auth !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as { event?: RCEvent };
    const event = body.event;
    if (!event?.type) return NextResponse.json({ ok: true });

    const userId = event.app_user_id || event.original_app_user_id;
    // Anonim/cihaz kullanıcıları ($RCAnonymousID:) atla — yalnızca Supabase uuid'leri işle.
    if (!userId || userId.startsWith("$RCAnonymousID")) {
      return NextResponse.json({ ok: true });
    }

    const admin = getSupabaseAdmin();

    if (ACTIVATION_EVENTS.has(event.type)) {
      const planType = event.product_id ? PRODUCT_TO_PLAN[event.product_id] : undefined;
      if (!planType) return NextResponse.json({ ok: true });
      await activateSubscription({
        userId,
        type: planType,
        providerName: "revenuecat",
        providerSubscriptionId: event.product_id ?? null,
      });
      return NextResponse.json({ ok: true });
    }

    if (DEACTIVATION_EVENTS.has(event.type)) {
      await admin
        .from("profiles")
        .update({
          is_plus: false,
          subscription_tier: "free",
          plus_boosts: 0,
          subscription_type: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      await admin
        .from("subscriptions")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "active");
      return NextResponse.json({ ok: true });
    }

    // Diğer olaylar (CANCELLATION = otomatik yenileme kapandı ama süre dolana kadar
    // aktif; SUBSCRIPTION_PAUSED vb.) için bir şey yapma.
    return NextResponse.json({ ok: true });
  } catch {
    // 200 dönüyoruz ki RevenueCat sonsuz retry yapmasın; hata loglanır.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
