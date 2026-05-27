"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";

/**
 * OAuth (Google / Apple) dönüş adresi.
 * - Sağlayıcıdan dönen kodu/oturumu işler.
 * - Oturum yoksa /login'e döner.
 * - Profil eksik/yaş onayı yoksa /complete-profile'a yönlendirir.
 * - Aksi halde ana sayfaya gider.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Giriş tamamlanıyor...");

  useEffect(() => {
    let active = true;

    (async () => {
      // PKCE kod akışı: URL'de ?code= varsa oturuma çevir (zaten çevrildiyse hatayı yut).
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code).catch(() => {});
        }
      } catch {
        /* yoksay */
      }

      // Oturum hazır olana kadar kısa süre bekle (detectSessionInUrl asenkron işler).
      let session = null;
      for (let i = 0; i < 10 && active; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }

      if (!active) return;

      if (!session?.user) {
        setMessage("Giriş yapılamadı. Yönlendiriliyorsun...");
        router.replace("/login");
        return;
      }

      // Profil tamam mı? (OAuth kullanıcıda username/gender/yaş eksik olabilir)
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, gender, age_confirmed")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      const incomplete =
        !profile ||
        !profile.age_confirmed ||
        !profile.username ||
        /^kullanici_/.test(profile.username as string);

      router.replace(incomplete ? "/complete-profile" : "/");
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-500" />
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </Container>
  );
}
