"use client";

import { useEffect } from "react";
import {
  hideSplash,
  setStatusBarTheme,
  initAppLifecycle,
  registerPushNotifications,
  isNative,
} from "@/lib/native";
import { supabase } from "@/lib/supabaseClient";
import { configureStoreKit } from "@/lib/payments/storekit";

/**
 * Native shell (iOS / Android) için bootstrap:
 * - Splash'i web hazır olunca kapat
 * - Status bar'ı uygulama temasına uydur
 * - Push notification token'ı al ve Supabase'e kaydet
 * - App lifecycle event'lerini bağla (resume / pause / backButton)
 *
 * Web ortamında hepsi no-op. SSR-safe.
 */
export function NativeShellInit() {
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!(await isNative())) return;

      // 1. Splash'i biraz gecikmeli kapat (web hazır olsun, beyaz flash olmasın)
      await hideSplash(300);
      if (!mounted) return;

      // 2. Status bar — body class'ına göre dark/light belirle
      const isLight = document.documentElement.classList.contains("light");
      await setStatusBarTheme(isLight ? "light" : "dark");

      // 3. Theme değişimini izle, status bar'ı senkronize et
      const obs = new MutationObserver(async () => {
        const light = document.documentElement.classList.contains("light");
        await setStatusBarTheme(light ? "light" : "dark");
      });
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

      // 4. App lifecycle
      await initAppLifecycle({
        onResume: () => {
          // Foreground'a dönünce verileri tazele
          window.dispatchEvent(new Event("anonix:resume"));
        },
        onBackButton: () => {
          // Modal açıksa kapat, değilse default davranış
          const modal = document.querySelector("[role='dialog'][aria-modal='true']");
          if (modal) {
            const closeBtn = modal.querySelector<HTMLButtonElement>("[aria-label='Kapat']");
            closeBtn?.click();
            return true;
          }
          return false;
        },
      });

      // 5. Push notifications + StoreKit — kullanıcı oturum açtıktan sonra
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // RevenueCat'i Supabase user.id ile başlat (cross-device subscription tracking)
        await configureStoreKit(user.id);

        await registerPushNotifications(async (token) => {
          // Supabase'e push token kaydet (push_tokens tablosu varsa)
          await supabase
            .from("push_tokens")
            .upsert(
              { user_id: user.id, token, platform: "ios" },
              { onConflict: "user_id,token" }
            );
        });
      }

      return () => {
        mounted = false;
        obs.disconnect();
      };
    })();
  }, []);

  return null;
}
