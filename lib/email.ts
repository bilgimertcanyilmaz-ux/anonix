import { getServerEnv } from "@/lib/env";

/**
 * Modüler e-posta gönderimi.
 * Öncelik sırası: 1) SMTP (nodemailer) - Hostinger gibi; 2) Resend (opsiyonel).
 * Hiçbiri yapılandırılmamışsa sessizce no-op döner.
 * SUNUCU tarafında kullanılır.
 */
export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  sent: boolean;
  reason?: string;
  provider?: "smtp" | "resend";
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getServerEnv();
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass || !env.fromEmail) {
    return { sent: false, reason: "SMTP yapılandırılmamış." };
  }
  try {
    // Dinamik import — webpack statik analizinden kaçınılması gerekmiyor ama
    // resend ile aynı pattern kullanılıyor (paket opsiyonel).
    const specifier = "nodemailer";
    const mod: unknown = await (Function(
      "s",
      "return import(s)"
    )(specifier) as Promise<unknown>);
    type SmtpTransporter = {
      sendMail: (opts: {
        from: string;
        to: string;
        subject: string;
        html: string;
      }) => Promise<unknown>;
    };
    const nodemailer = mod as {
      createTransport?: (opts: {
        host: string;
        port: number;
        secure: boolean;
        auth: { user: string; pass: string };
      }) => SmtpTransporter;
      default?: {
        createTransport?: (opts: {
          host: string;
          port: number;
          secure: boolean;
          auth: { user: string; pass: string };
        }) => SmtpTransporter;
      };
    };
    const createTransport =
      nodemailer.createTransport || nodemailer.default?.createTransport;
    if (!createTransport) {
      return { sent: false, reason: "nodemailer createTransport bulunamadı." };
    }
    const transporter = createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure, // true: 465 SSL, false: 587 STARTTLS
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
    await transporter.sendMail({
      from: env.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { sent: true, provider: "smtp" };
  } catch (e) {
    return { sent: false, reason: (e as Error).message, provider: "smtp" };
  }
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getServerEnv();
  if (!env.resendApiKey || !env.fromEmail) {
    return {
      sent: false,
      reason: "Resend yapılandırılmamış (RESEND_API_KEY/FROM_EMAIL).",
    };
  }
  try {
    const specifier = "resend";
    const mod: unknown = await (Function(
      "s",
      "return import(s)"
    )(specifier) as Promise<unknown>);
    const Resend = (mod as { Resend?: new (k: string) => unknown }).Resend;
    if (!Resend) return { sent: false, reason: "resend paketi yüklü değil." };
    const client = new Resend(env.resendApiKey) as {
      emails: {
        send: (p: {
          from: string;
          to: string;
          subject: string;
          html: string;
        }) => Promise<unknown>;
      };
    };
    await client.emails.send({
      from: env.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { sent: true, provider: "resend" };
  } catch (e) {
    return { sent: false, reason: (e as Error).message, provider: "resend" };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const env = getServerEnv();
  // SMTP yapılandırılmışsa önce onu dene
  if (env.smtpHost && env.smtpUser && env.smtpPass) {
    return sendViaSmtp(input);
  }
  // Aksi halde Resend
  if (env.resendApiKey) {
    return sendViaResend(input);
  }
  return { sent: false, reason: "Hiçbir e-posta sağlayıcı yapılandırılmamış." };
}
