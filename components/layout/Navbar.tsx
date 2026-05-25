"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MaskIcon, SparkIcon, ChatIcon } from "@/components/ui/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUnread } from "@/components/messages/UnreadProvider";

/** Üst navigasyon çubuğu (yapışkan, cam efektli). Oturum durumuna göre değişir. */
export function Navbar() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { unreadCount } = useUnread();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient shadow-glow">
            <MaskIcon className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Anon<span className="text-gradient">ix</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/confessions"
            className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:inline-flex"
          >
            Keşfet
          </Link>
          <Link
            href="/golge"
            className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:inline-flex"
          >
            Gölge
          </Link>
          <Link
            href="/confessions/new"
            className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:inline-flex"
          >
            İtiraf Yaz
          </Link>
          <Link
            href="/plus"
            className="hidden items-center gap-1.5 rounded-full border border-brand-500/40 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-200 transition-colors hover:bg-brand-500/20 sm:inline-flex"
          >
            <SparkIcon className="h-3.5 w-3.5" />
            Plus
          </Link>

          {loading ? (
            // Oturum durumu yüklenirken yer tutucu
            <span className="h-8 w-20 animate-pulse rounded-full bg-white/5" />
          ) : user ? (
            <>
              <Link
                href="/messages"
                aria-label="Mesajlar"
                className="relative rounded-full bg-white/5 p-2 text-slate-200 transition-colors hover:bg-white/10"
              >
                <ChatIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
              >
                Profil
              </Link>
              <button
                onClick={handleSignOut}
                className="hidden rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 sm:inline-flex"
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
