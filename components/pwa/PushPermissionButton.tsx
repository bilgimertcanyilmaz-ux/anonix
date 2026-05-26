"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { isPushSupported, subscribeToPush } from "@/lib/push";
import { trackEvent } from "@/lib/analytics";

/**
 * Push bildirim izni butonu (Web Push altyapısına hazırlık).
 * İzin alındığında push_subscriptions'a kayıt eklenir (şimdilik mock endpoint).
 * Gerçek Web Push ileride VAPID + SW push event ile bağlanabilir.
 */
export function PushPermissionButton() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !user || !isPushSupported()) return null;

  async function enable() {
    if (!user) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toastError("Bildirim izni verilmedi.");
        setBusy(false);
        return;
      }
      const res = await subscribeToPush(user.id);
      if (res.ok) {
        setDone(true);
        void trackEvent("push_permission_granted", {}, user.id);
        success("Push bildirimleri etkinleştirildi 🔔");
      } else {
        toastError("Abonelik kaydedilemedi.");
      }
    } catch {
      toastError("Bir şeyler ters gitti. Lütfen tekrar dene.");
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={enable}
      disabled={busy || done}
      className="w-full rounded-full border border-brand-500/40 bg-brand-500/10 px-4 py-2.5 text-sm font-semibold text-brand-200 transition-colors hover:bg-brand-500/20 disabled:opacity-60"
    >
      {done ? "Push bildirimleri açık" : busy ? "İzin isteniyor..." : "🔔 Push bildirimlerine izin ver"}
    </button>
  );
}
