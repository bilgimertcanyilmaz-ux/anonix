/**
 * Supabase Auth hata mesajlarını kullanıcı dostu Türkçe metinlere çevirir.
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
