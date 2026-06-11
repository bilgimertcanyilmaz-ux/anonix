"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { SparkIcon, BellIcon, LogoutIcon } from "@/components/ui/icons";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotif } from "@/components/notifications/NotifProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Bulunulan sayfanın ilgili nav öğesini aktif sayar (alt rotalar dahil). */
function matchActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/confessions/new") return false;
  if (href === "/confessions")
    return pathname.startsWith("/confessions/") && pathname !== "/confessions/new";
  return pathname.startsWith(href + "/");
}

const NAV_LINKS: { href: string; label: string; authOnly?: boolean }[] = [
  { href: "/confessions", label: "Keşfet" },
  { href: "/golge", label: "Gölge" },
  { href: "/leaderboard", label: "Liderlik" },
  { href: "/for-you", label: "Sana Özel", authOnly: true },
  { href: "/confessions/new", label: "İtiraf Yaz" },
];

/** Üst navigasyon çubuğu (yapışkan, cam efektli). Oturum durumuna göre değişir. */
export function Navbar() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { user, profile, loading, signOut } = useAuth();
  const { unreadCount: notifCount } = useNotif();

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/65 backdrop-blur-xl [padding-top:env(safe-area-inset-top)]">
      {/* Üst hafif neon hat — premium dokunuş */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent" />
      <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between gap-3 px-4 sm:px-6 lg:max-w-6xl">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <motion.span whileHover={{ rotate: -6, scale: 1.05 }} className="relative inline-flex">
            <span
              className="absolute inset-0 rounded-xl bg-brand-500/40 blur-md transition-opacity duration-300 group-hover:bg-brand-400/55"
              aria-hidden
            />
            <Image
              src="/logo.png"
              alt="Anonix"
              width={36}
              height={36}
              priority
              className="relative rounded-xl shadow-glow"
            />
          </motion.span>
          <span className="text-lg font-extrabold tracking-tight text-white">
            Anon<span className="text-gradient">ix</span>
          </span>
        </Link>

        {/* Sağ küme: nav linkleri (lg) + aksiyonlar */}
        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5 lg:gap-2">
          {/* Masaüstü linkleri — kayan aktif pill */}
          <nav className="hidden items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-1 lg:flex">
            {NAV_LINKS.filter((l) => !l.authOnly || user).map((l) => {
              const active = matchActive(pathname, l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors"
                  style={{ color: active ? "#fff" : undefined }}
                >
                  {active && (
                    <motion.span
                      layoutId="topNavActive"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "linear-gradient(135deg, rgba(168,85,247,0.9), rgba(124,58,237,0.9))",
                        boxShadow: "0 2px 12px -3px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
                      }}
                    />
                  )}
                  <span
                    className={`relative ${active ? "" : "text-slate-300 hover:text-white"}`}
                    style={active ? { color: "#fff" } : undefined}
                  >
                    {l.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Plus */}
          <Link
            href="/plus"
            className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-gold-400/50 bg-gradient-to-r from-gold-500/15 to-brand-500/15 px-3 py-1.5 text-xs font-bold text-gold-300 shadow-glow-sm transition-all hover:from-gold-500/25 hover:to-brand-500/25 hover:shadow-glow-gold md:inline-flex"
          >
            <SparkIcon className="h-3.5 w-3.5" />
            Plus
          </Link>

          <ThemeToggle />

          {loading ? (
            <span className="h-8 w-20 animate-pulse rounded-full bg-white/5" />
          ) : user ? (
            <>
              {/* Bildirimler — okunmamışta çalkalanan zil + gradyan rozet */}
              <Link
                href="/notifications"
                aria-label="Bildirimler"
                className="relative rounded-full bg-white/5 p-2 text-slate-200 transition-colors hover:bg-white/10"
              >
                <motion.span
                  className="block"
                  animate={notifCount > 0 ? { rotate: [0, -14, 12, -8, 6, 0] } : {}}
                  transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 5 }}
                >
                  <BellIcon className="h-5 w-5" />
                </motion.span>
                {notifCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-ink-950"
                    style={{
                      background: "linear-gradient(135deg, #f472b6, #ec4899)",
                      color: "#fff",
                      boxShadow: "0 0 10px rgba(236,72,153,0.7)",
                    }}
                  >
                    {notifCount > 99 ? "99+" : notifCount}
                  </span>
                )}
              </Link>

              {/* Admin */}
              {profile?.role === "admin" && (
                <Link
                  href="/admin"
                  className="hidden whitespace-nowrap rounded-full bg-brand-500/15 px-3 py-1.5 text-sm font-semibold text-brand-200 ring-1 ring-inset ring-brand-400/30 transition-colors hover:bg-brand-500/25 md:inline-flex"
                >
                  🛡️ Admin
                </Link>
              )}

              {/* Profil — avatarlı çip */}
              <Link
                href="/profile"
                aria-label="Profil"
                className={`flex items-center gap-2 rounded-full bg-white/5 py-1 pl-1 pr-1 transition-all hover:bg-white/10 sm:pr-3 ${
                  pathname.startsWith("/profile")
                    ? "ring-1 ring-brand-400/60 shadow-glow-sm"
                    : "ring-1 ring-white/10"
                }`}
              >
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center text-xs font-extrabold"
                      style={{
                        background: "linear-gradient(135deg, #a855f7, #ec4899)",
                        color: "#fff",
                      }}
                    >
                      {profile?.username?.[0]?.toUpperCase() ?? "A"}
                    </span>
                  )}
                </span>
                <span className="hidden max-w-[96px] truncate text-sm font-semibold text-slate-200 sm:inline">
                  {profile?.username ?? "Profil"}
                </span>
              </Link>

              {/* Çıkış — mobilde gizli (profil sayfasında da var), sm+ ikon */}
              <button
                onClick={handleSignOut}
                aria-label="Çıkış Yap"
                title="Çıkış Yap"
                className="hidden items-center rounded-full bg-white/5 p-2 text-slate-300 transition-colors hover:bg-red-500/15 hover:text-red-300 sm:inline-flex"
              >
                <LogoutIcon className="h-4 w-4 shrink-0" />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="whitespace-nowrap rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
              >
                Giriş Yap
              </Link>
              <Link
                href="/register"
                className="group relative overflow-hidden whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold shadow-glow transition-transform active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #ec4899 0%, #a855f7 55%, #7c3aed 100%)",
                  color: "#fff",
                }}
              >
                <span aria-hidden className="pointer-events-none absolute inset-0">
                  <motion.span
                    animate={{ x: ["-120%", "220%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
                    className="absolute inset-y-0 w-1/3"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                    }}
                  />
                </span>
                <span className="relative" style={{ color: "#fff" }}>
                  Kayıt Ol
                </span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
