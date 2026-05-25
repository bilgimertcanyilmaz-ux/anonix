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
    // @ts-expect-error resend paketi opsiyonel; kuruluysa yüklenir
    const { Resend } = await import("resend");
    const resend = new Resend(env.resendApiKey);
    await resend.emails.send({
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
