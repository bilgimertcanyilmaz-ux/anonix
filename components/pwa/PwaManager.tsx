"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "anonix-pwa-dismissed";

/**
 * PWA yöneticisi: service worker kaydı + "Uygulama gibi yükle" istemi.
 * - SW yalnızca production'da kaydolur (dev cache sorunlarını önlemek için).
 * - Yükleme butonu yalnızca uygun cihazlarda (beforeinstallprompt) görünür.
 * - Kullanıcı reddederse tekrar gösterilmez (localStorage).
 */
export function PwaManager() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  // Service worker kaydı
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    )
      return;
    const onLoad = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Install prompt yakalama
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    // Zaten yüklüyse gösterme
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice.catch(() => {});
    setVisible(false);
    setDeferred(null);
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-50 mx-auto max-w-md md:bottom-6">
      <div className="card flex items-center gap-3 border-brand-500/30 p-3 shadow-glow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Anonix" className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Anonix&apos;i yükle</p>
          <p className="truncate text-xs text-slate-400">Uygulama gibi hızlı erişim.</p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full px-2 py-1 text-xs text-slate-400 hover:text-white"
        >
          Daha sonra
        </button>
        <button
          onClick={install}
          className="shrink-0 rounded-full bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white shadow-glow"
        >
          Yükle
        </button>
      </div>
    </div>
  );
}
