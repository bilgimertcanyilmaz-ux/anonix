/**
 * Ortam değişkeni doğrulama.
 * - public: NEXT_PUBLIC_* (istemciye gömülür)
 * - private: yalnızca sunucuda erişilebilir (service_role, iyzico, resend...)
 *
 * NEXT_PUBLIC olmayan değişkenler istemci bundle'ına ASLA dahil edilmez.
 */

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://anonix.app",
};

/** Yalnızca SUNUCU tarafında çağrılmalı. */
export function getServerEnv() {
  return {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    iyzicoApiKey: process.env.IYZIPAY_API_KEY || "",
    iyzicoSecretKey: process.env.IYZIPAY_SECRET_KEY || "",
    iyzicoBaseUrl: process.env.IYZIPAY_BASE_URL || "https://sandbox-api.iyzipay.com",
    resendApiKey: process.env.RESEND_API_KEY || "",
    fromEmail: process.env.FROM_EMAIL || "",
    adminEmail: process.env.ADMIN_EMAIL || "",
  };
}

interface EnvCheck {
  ok: boolean;
  missingPublic: string[];
  missingPrivate: string[];
}

/**
 * Üretim için gerekli değişkenleri kontrol eder.
 * Sunucuda çağrılırsa private değişkenleri de kontrol eder.
 */
export function checkRequiredEnv(): EnvCheck {
  const missingPublic: string[] = [];
  const missingPrivate: string[] = [];

  if (!publicEnv.supabaseUrl) missingPublic.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publicEnv.supabaseAnonKey) missingPublic.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!process.env.NEXT_PUBLIC_SITE_URL) missingPublic.push("NEXT_PUBLIC_SITE_URL");

  // Private değişkenler yalnızca sunucuda görünür (istemcide undefined olur, atlanır)
  if (typeof window === "undefined") {
    const s = getServerEnv();
    if (!s.serviceRoleKey) missingPrivate.push("SUPABASE_SERVICE_ROLE_KEY");
    if (!s.iyzicoApiKey) missingPrivate.push("IYZIPAY_API_KEY");
    if (!s.iyzicoSecretKey) missingPrivate.push("IYZIPAY_SECRET_KEY");
  }

  return {
    ok: missingPublic.length === 0 && missingPrivate.length === 0,
    missingPublic,
    missingPrivate,
  };
}

/** Üretimde eksik kritik public env varsa net hata fırlat. */
export function assertPublicEnv() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) {
    const msg =
      "[Anonix] Kritik ortam değişkenleri eksik: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. .env.local dosyasını kontrol edin.";
    if (process.env.NODE_ENV === "production") throw new Error(msg);
    console.warn(msg);
  }
}
