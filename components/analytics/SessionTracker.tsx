"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { trackEvent } from "@/lib/analytics";

/**
 * Oturum analitiği: sayfa görüntüleme sayısı + aktif süre.
 * - Sekme gizlenince / kapanırken session_duration olayı gönderir.
 * - Sade ve PII içermez; yalnızca süre (sn) + görüntüleme sayısı.
 */
export function SessionTracker() {
  const { user } = useAuth();
  const pathname = usePathname();
  const startRef = useRef<number>(Date.now());
  const viewsRef = useRef<number>(0);
  const sentRef = useRef<boolean>(false);

  // Her rota değişiminde görüntüleme say
  useEffect(() => {
    viewsRef.current += 1;
  }, [pathname]);

  useEffect(() => {
    const flush = () => {
      if (sentRef.current) return;
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      // Çok kısa (1 sn altı) oturumları yoksay
      if (seconds < 1) return;
      sentRef.current = true;
      void trackEvent(
        "session_duration",
        { seconds, views: viewsRef.current },
        user?.id ?? null
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [user]);

  return null;
}
