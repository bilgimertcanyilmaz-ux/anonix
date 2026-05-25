import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createPayment } from "@/lib/payments";
import { getPlan } from "@/lib/payments/plans";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1) Sunucu tarafı kimlik doğrulama (Bearer token)
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
    }
    const user = userData.user;

    // 2) Plan
    const body = await req.json().catch(() => ({}));
    const plan = getPlan(String(body?.plan));
    if (!plan) {
      return NextResponse.json({ error: "Geçersiz plan." }, { status: 400 });
    }

    // 3) Profil bilgileri
    const { data: profile } = await admin
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    // 4) Checkout başlat
    const conversationId = crypto.randomUUID();
    const result = await createPayment({
      plan,
      user: {
        id: user.id,
        email: user.email || "anonim@anonix.app",
        username: profile?.username || "anonix",
      },
      callbackUrl: `${siteConfig.url}/api/payments/callback`,
      conversationId,
    });

    if (!result.ok || !result.token) {
      return NextResponse.json(
        { error: result.error || "Ödeme başlatılamadı." },
        { status: 400 }
      );
    }

    // 5) Bekleyen ödeme kaydı (token ile eşleştirilir)
    await admin.from("payment_logs").insert({
      user_id: user.id,
      provider: "iyzico",
      payment_id: result.token,
      amount: plan.price,
      currency: plan.currency,
      status: "pending",
      raw_response: { plan_type: plan.type, conversationId },
    });

    return NextResponse.json({
      paymentPageUrl: result.paymentPageUrl,
      checkoutFormContent: result.checkoutFormContent,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
