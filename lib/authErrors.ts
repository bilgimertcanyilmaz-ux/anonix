/**
 * Supabase Auth hata mesajlarını kullanıcı dostu Türkçe metinlere çevirir.
 *
 * - `authErrorToTr(message)`: e-posta/şifre akışları için klasik string mapper.
 * - `mapSupabaseAuthError(error)`: OAuth dahil her türlü Supabase auth hata
 *   nesnesini güvenli şekilde Türkçe mesaja çevirir (ham JSON sızdırmaz).
 */

export function authErrorToTr(message?: string | null): string {
  if (!message) return "Bir hata oluştu. Lütfen tekrar deneyin.";
  const m = message.toLowerCase();

  if (m.includes("invalid login credentials"))
    return "E-posta veya şifre hatalı.";
  if (m.includes("email not confirmed"))
    return "E-posta adresin henüz doğrulanmamış. Gelen kutunu kontrol et.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "Bu e-posta ile zaten bir hesap var.";
  if (m.includes("password should be at least"))
    return "Şifre en az 6 karakter olmalı.";
  if (m.includes("unable to validate email") || m.includes("invalid format"))
    return "Geçerli bir e-posta adresi gir.";
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many"))
    return "Çok fazla deneme yaptın. Lütfen biraz sonra tekrar dene.";
  if (m.includes("duplicate key") || m.includes("23505"))
    return "Bu kullanıcı adı zaten alınmış. Farklı bir kullanıcı adı dene.";
  if (m.includes("database error"))
    return "Kullanıcı adı alınmış olabilir. Lütfen farklı bir kullanıcı adı dene.";
  if (m.includes("network") || m.includes("fetch"))
    return "Bağlantı hatası. İnternet bağlantını kontrol et.";

  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}

/** mapSupabaseAuthError için kabul edilen esnek hata türü. */
type SupabaseAuthError =
  | {
      message?: string | null;
      code?: string | number | null;
      status?: number | null;
      error_code?: string | null;
      error?: string | null;
      msg?: string | null;
      error_description?: string | null;
      name?: string | null;
    }
  | string
  | null
  | undefined;

/**
 * Her türlü Supabase auth/OAuth hatasını Türkçe mesaja çevirir.
 * Hatanın message/error_code/msg/error_description alanlarını birlikte tarar,
 * böylece ham JSON ("provider is not enabled" vb.) kullanıcıya gösterilmez.
 */
export function mapSupabaseAuthError(err: SupabaseAuthError): string {
  if (err == null) return "Bir hata oluştu. Lütfen tekrar deneyin.";

  const obj: { [k: string]: unknown } = typeof err === "string" ? { message: err } : { ...err };
  const blob = [
    obj.message,
    obj.error,
    obj.error_code,
    obj.msg,
    obj.error_description,
    obj.code,
    obj.name,
  ]
    .filter((x) => x !== undefined && x !== null)
    .map((x) => String(x).toLowerCase())
    .join(" | ");

  // Sağlayıcı kapalı (en sık görülen OAuth hatası)
  if (
    blob.includes("provider is not enabled") ||
    blob.includes("provider_not_enabled") ||
    blob.includes("unsupported provider") ||
    blob.includes("validation_failed")
  ) {
    return "Sosyal giriş sağlayıcısı şu anda aktif değil. Lütfen e-posta ile devam et.";
  }

  // Yönlendirme URL'i izin verilenler arasında değil
  if (
    blob.includes("invalid_redirect_url") ||
    blob.includes("redirect_url") && blob.includes("not allowed") ||
    blob.includes("redirect url is not allowed")
  ) {
    return "Giriş yönlendirme ayarı hatalı. (Yönetici Supabase'de Redirect URL eklemeli.)";
  }

  // Kullanıcı sağlayıcıdan erişimi reddetti
  if (blob.includes("access_denied") || blob.includes("access denied")) {
    return "Google hesabı erişimi reddetti.";
  }

  // OAuth code akışında token değişimi başarısız
  if (blob.includes("invalid_grant") || blob.includes("expired") && blob.includes("code")) {
    return "Giriş kodu geçersiz veya süresi doldu. Lütfen tekrar dene.";
  }

  // Sunucu geçici hatası
  if (
    blob.includes("server_error") ||
    blob.includes("temporarily unavailable") ||
    blob.includes("503") ||
    blob.includes("502")
  ) {
    return "Sosyal giriş geçici olarak kullanılamıyor. Lütfen tekrar dene.";
  }

  // E-posta/şifre yolundaki bilinen hatalar
  const msg = (obj.message as string | null) ?? (obj.msg as string | null) ?? null;
  if (msg) return authErrorToTr(msg);

  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}
