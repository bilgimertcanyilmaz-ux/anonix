import { getServerEnv } from "@/lib/env";

/**
 * Modüler e-posta gönderimi (Resend).
 * SUNUCU tarafında kullanılır. Yapılandırılmamışsa sessizce no-op döner.
 * Aktifleştirmek için: `npm i resend` + RESEND_API_KEY / FROM_EMAIL env.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getServerEnv();
  if (!env.resendApiKey || !env.fromEmail) {
    return { sent: false, reason: "E-posta yapılandırılmamış (RESEND_API_KEY/FROM_EMAIL)." };
  }
  try {
    // resend opsiyonel paket — webpack'in statik analizinden kaçınmak için
    // dinamik specifier kullanılıyor. Paket kuruluysa runtime'da yüklenir.
    const specifier = "resend";
    const mod: unknown = await (Function(
      "s",
      "return import(s)"
    )(specifier) as Promise<unknown>);
    const Resend = (mod as { Resend?: new (k: string) => unknown }).Resend;
    if (!Resend) return { sent: false, reason: "resend paketi yüklü değil." };
    const client = new Resend(env.resendApiKey) as {
      emails: { send: (p: { from: string; to: string; subject: string; html: string }) => Promise<unknown> };
    };
    await client.emails.send({
      from: env.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: (e as Error).message };
  }
}
