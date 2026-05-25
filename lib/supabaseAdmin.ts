import { createClient } from "@supabase/supabase-js";

/**
 * SUNUCU TARAFI Supabase istemcisi (service_role).
 * RLS'i atlar — yalnızca güvenilir sunucu kodunda (API route'ları) kullanılır.
 * service_role anahtarı ASLA istemciye gönderilmez (NEXT_PUBLIC_ prefix'i YOK).
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin() {
  if (!url || !serviceRole) {
    throw new Error(
      "Sunucu yapılandırması eksik: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli."
    );
  }
  return createClient(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
