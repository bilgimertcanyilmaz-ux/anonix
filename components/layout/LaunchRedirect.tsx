"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Yeni oturum açılışında (uygulama/sekme yeniden açıldığında) kullanıcıyı
 * anasayfaya (/) yönlendirir — böylece herkes Keşfet yerine anasayfada başlar.
 *
 * - Yalnızca aşağıdaki "tab" sayfalarına düşülmüşse yönlendirir; paylaşılan
 *   derin linkler (örn. /confessions/123, /users/x) ve oturum sayfaları korunur.
 * - sessionStorage bayrağı ile yalnızca oturumun İLK açılışında çalışır;
 *   uygulama içi gezinme ve sayfa yenileme (F5) etkilenmez.
 */
const REDIRECT_ON_LAUNCH = new Set(["/confessions", "/golge", "/leaderboard", "/for-you"]);

export function LaunchRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const KEY = "anonix-launched";
      if (sessionStorage.getItem(KEY)) return; // bu oturumda zaten açıldı
      sessionStorage.setItem(KEY, "1");
      if (REDIRECT_ON_LAUNCH.has(pathname)) {
        router.replace("/");
      }
    } catch {
      /* sessionStorage erişilemezse sessizce geç */
    }
    // Yalnızca ilk yüklemede çalışır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
