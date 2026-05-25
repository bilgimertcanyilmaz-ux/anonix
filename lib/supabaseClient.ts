import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Geliştirme sırasında ortam değişkenleri eksikse erken uyarı ver.
  // (.env.local.example dosyasını .env.local olarak kopyalayın.)
  console.warn(
    "[Anonix] Supabase ortam değişkenleri eksik. " +
      "NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlayın."
  );
}

/**
 * Tarayıcı/istemci tarafı için paylaşılan Supabase istemcisi.
 * Ortam değişkenleri eksikse (örn. ilk build), createClient hata fırlatmasın
 * diye geçerli biçimde yer tutucu değerler kullanılır. Gerçek istekler
 * yalnızca .env.local doğru doldurulduğunda çalışır.
 */
export const supabase = createClient(
  supabaseUrl || "http://localhost:54321",
  supabaseAnonKey || "anonix-placeholder-anon-key"
);
