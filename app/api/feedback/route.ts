import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_TYPES = new Set(["general", "feedback", "bug", "idea"]);

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Supabase istemcisi — yalnızca anon key kullanır (service_role gerektirmez).
 * Auth doğrulama: opsiyonel Bearer JWT, auth.getUser(token) ile çözülür.
 * Insert: feedback_reports RLS politikası user_id=null veya auth.uid()=user_id'ye izin verir.
 */
function getClient(token?: string | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Token verilirse insert kullanıcı bağlamında çalışır (RLS: auth.uid()=user_id geçer).
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  });
}

/** Geri bildirim gönder: DB'ye kaydet + support@anonix.digital'e e-posta. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { type, message } = body as { type?: string; message?: string };
    const { user_email, page_url, user_agent } = body as {
      user_email?: string | null;
      page_url?: string | null;
      user_agent?: string | null;
    };

    // Doğrulama
    type = (type ?? "feedback").toString().toLowerCase();
    if (type === "general") type = "feedback"; // mevcut DB'de 'feedback' kullanılıyor
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });
    }
    if (!message || message.trim().length < 3) {
      return NextResponse.json({ error: "Mesaj çok kısa." }, { status: 400 });
    }
    const cleanMessage = message.trim().slice(0, 2000);

    // Opsiyonel oturum (Bearer JWT) — service_role gerektirmez.
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "").trim() || null;

    const anonClient = getClient();
    let userId: string | null = null;
    let detectedEmail: string | null = null;
    if (token) {
      const { data } = await anonClient.auth.getUser(token);
      userId = data.user?.id ?? null;
      detectedEmail = data.user?.email ?? null;
    }

    // Girişli + geçerli token ise insert'i KULLANICI bağlamında yap; aksi halde anon.
    // (RLS: with check (user_id is null or auth.uid() = user_id) — anon client'ta
    //  auth.uid() null olduğundan dolu user_id ile insert reddediliyordu.)
    const supabase = userId && token ? getClient(token) : anonClient;
    const finalEmail = (user_email && /@/.test(user_email) ? user_email : null) || detectedEmail;

    // İstemci IP (rate-limit + iz için)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    // RLS: user_id null veya auth.uid()=user_id allow → anon client ile insert çalışır.
    const { error: dbErr } = await supabase.from("feedback_reports").insert({
      user_id: userId,
      kind: type,
      message: cleanMessage,
      page: page_url ?? null,
      meta: {
        user_email: finalEmail,
        user_agent: user_agent ?? null,
        ip,
      },
    });

    if (dbErr) {
      if ((dbErr.message || "").toLowerCase().includes("çok fazla")) {
        return NextResponse.json(
          { error: "Çok fazla geri bildirim gönderdin. Lütfen biraz sonra tekrar dene." },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Geri bildirim kaydedilemedi." }, { status: 500 });
    }

    // E-posta (yapılandırılmışsa) — fire-and-forget; hata akışı bozmaz
    const env = getServerEnv();
    const to = env.supportEmail || "destek@anonix.digital";
    // E-posta SMTP (Hostinger) veya Resend ile gönderilir; ikisi de fromEmail ister.
    if (env.fromEmail && (env.smtpHost || env.resendApiKey)) {
      const html =
        `<h2>Yeni Anonix Geri Bildirimi</h2>` +
        `<p><strong>Tür:</strong> ${esc(type)}</p>` +
        `<p><strong>Mesaj:</strong><br/>${esc(cleanMessage).replace(/\n/g, "<br/>")}</p>` +
        `<p><strong>Kullanıcı:</strong> ${esc(finalEmail ?? "—")} (${esc(userId ?? "anonim")})</p>` +
        `<p><strong>Sayfa:</strong> ${esc(page_url ?? "—")}</p>` +
        `<p><strong>User-Agent:</strong> ${esc(user_agent ?? "—")}</p>` +
        `<p><strong>IP:</strong> ${esc(ip ?? "—")}</p>` +
        `<p><strong>Tarih:</strong> ${new Date().toISOString()}</p>`;
      void sendEmail({ to, subject: "Yeni Anonix Geri Bildirimi", html });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
