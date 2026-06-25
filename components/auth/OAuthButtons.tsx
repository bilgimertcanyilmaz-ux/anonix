"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { useToast } from "@/components/ui/ToastProvider";

/** Google logosu (resmi renkli "G"). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

/** Apple logosu. */
function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
    </svg>
  );
}

/**
 * Google / Apple ile sosyal giriş butonları.
 * Hem /login hem /register'da kullanılır. Dönüş /auth/callback'te ele alınır.
 */
export function OAuthButtons() {
  const { signInWithOAuth } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function go(provider: "google" | "apple") {
    setError(null);
    setBusy(provider);

    // Hem Google hem Apple, Supabase web OAuth ile çalışır.
    // (Uygulama anonix.digital'i webview içinde açtığından redirect akışı geçerli;
    //  native Apple eklentisi RevenueCat/Capacitor 8 ile çakıştığı için kaldırıldı.)
    const res = await signInWithOAuth(provider);
    if (res.error) {
      setError(res.error);
      toast.error(
        provider === "google" ? "Google ile giriş yapılamadı." : "Apple ile giriş yapılamadı."
      );
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && <ErrorMessage>{error}</ErrorMessage>}

      <button
        type="button"
        onClick={() => go("google")}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:opacity-60"
      >
        <GoogleIcon />
        {busy === "google" ? "Yönlendiriliyor..." : "Google ile devam et"}
      </button>

      <button
        type="button"
        onClick={() => go("apple")}
        disabled={busy !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:opacity-60"
      >
        <AppleIcon />
        {busy === "apple" ? "Yönlendiriliyor..." : "Apple ile devam et"}
      </button>

      {/* Ayırıcı */}
      <div className="flex items-center gap-3 py-1">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-400">veya e-posta ile</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </div>
  );
}
