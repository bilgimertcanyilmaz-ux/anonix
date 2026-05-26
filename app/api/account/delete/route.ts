import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

/**
 * Hesap silme — yalnızca giriş yapan kullanıcı kendi hesabını siler.
 * İstemci Authorization: Bearer <access_token> gönderir; token sunucuda
 * doğrulanır, ardından service_role ile auth kullanıcısı silinir
 * (profiles ve ilişkili tüm veriler FK cascade ile temizlenir).
 * service_role anahtarı yalnızca sunucuda kullanılır, istemciye sızmaz.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Yetkisiz işlem." }, { status: 401 });
    }

    let reason: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.reason === "string") reason = body.reason.slice(0, 500);
    } catch {
      /* gövde opsiyonel */
    }

    const admin = getSupabaseAdmin();

    // Token'ı sunucu tarafında doğrula → gerçek kullanıcıyı al
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) {
      return NextResponse.json({ error: "Oturum geçersiz." }, { status: 401 });
    }

    // Silme logu (RLS service_role ile atlanır)
    await admin.from("account_deletion_logs").insert({
      user_id: user.id,
      email: user.email ?? null,
      reason,
    });

    // Auth kullanıcısını sil → profiles + ilişkili veriler cascade ile silinir
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return NextResponse.json({ error: "Hesap silinemedi. Lütfen tekrar dene." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Hesap silme şu an yapılamıyor. Sunucu yapılandırmasını kontrol et." },
      { status: 500 }
    );
  }
}
