import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyPayment, activateSubscription } from "@/lib/payments";
import { siteConfig } from "@/lib/site";
import type { SubscriptionType } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redirect = (status: string) =>
  NextResponse.redirect(`${siteConfig.url}/plus?status=${status}`, { status: 303 });

export async function POST(req: NextRequest) {
  try {
    // iyzico CF, token'ı form-urlencoded olarak POST eder
    const form = await req.formData();
    const token = String(form.get("token") || "");
    if (!token) return redirect("failed");

    const admin = getSupabaseAdmin();

    // Ödemeyi SUNUCU TARAFINDA doğrula (sahte callback engellenir)
    const verification = await verifyPayment(token);

    // Bekleyen ödeme kaydını bul
    const { data: log } = await admin
      .from("payment_logs")
      .select("*")
      .eq("payment_id", token)
      .maybeSingle();

    if (!verification.ok || !verification.success || !log) {
      if (log) {
        await admin
          .from("payment_logs")
          .update({ status: "failed", raw_response: verification.raw ?? {} })
          .eq("id", log.id);
      }
      return redirect("failed");
    }

    // Zaten işlenmişse tekrar aktifleştirme (idempotent)
    if (log.status === "success") return redirect("success");

    const planType = (log.raw_response as { plan_type?: string })?.plan_type as SubscriptionType;
    if (log.user_id && planType) {
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

    return redirect("success");
  } catch {
    return redirect("failed");
  }
}

// Bazı sağlayıcılar GET ile döner; güvenli tarafta kalmak için yönlendir
export async function GET() {
  return redirect("failed");
}
