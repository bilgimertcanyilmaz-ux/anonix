import { supabase } from "@/lib/supabaseClient";

/**
 * Davet kodunun geçerliliğini kontrol eder (kayıt öncesi).
 * DB tarafında check_invite_code RPC'si bilgi sızdırmadan true/false döner.
 */
export async function checkInviteCode(code: string): Promise<boolean> {
  const trimmed = code.trim();
  if (!trimmed) return false;
  try {
    const { data, error } = await supabase.rpc("check_invite_code", { p_code: trimmed });
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}
