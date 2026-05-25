import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPayment, activateSubscription } from "@/lib/payments";
import type { SubscriptionType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * iyzico bildirim/webhook ucu.
 * Güvenlik: gelen token sunucu tarafında tekrar DOĞRULANIR (sahte webhook engellenir).
 * Not: iyzico imza doğrulaması için panelden alınan secret ile ek kontrol eklenebilir.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const token = String((body as { token?: string }).token || "");
    if (!token) return NextResponse.json({ ok: false }, { status: 400 });

    const admin = getSupabaseAdmin();
    const verification = await verifyPayment(token);

    const { data: log } = await admin
      .from("payment_logs")
      .select("*")
      .eq("payment_id", token)
      .maybeSingle();

    if (!verification.ok || !verification.success || !log) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    if (log.status !== "success" && log.user_id) {
      const planType = (log.raw_response as { plan_type?: string })?.plan_type as SubscriptionType;
      if (planType) {
        await activateSubscription({
          userId: log.user_id,
          type: planType,
          providerName: "iyzico",
          providerSubscriptionId: verification.paymentId ?? null,
        });
      }
      await admin
        .from("payment_logs")
        .update({ status: "success", raw_response: verification.raw ?? {} })
        .eq("id", log.id);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
