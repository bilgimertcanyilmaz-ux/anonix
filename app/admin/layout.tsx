"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { ShieldIcon } from "@/components/ui/icons";

const navItems = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/reports", label: "Şikayetler" },
  { href: "/admin/users", label: "Kullanıcılar" },
  { href: "/admin/moderation", label: "Moderasyon" },
  { href: "/admin/banned-words", label: "Yasaklı Kelimeler" },
  { href: "/admin/launch-checklist", label: "Canlıya Hazırlık" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();

  const isAdmin = profile?.role === "admin";

  // Admin olmayanları ana sayfaya yönlendir.
  // NOT: Asıl güvenlik veritabanı RLS politikalarındadır (is_admin()).
  // Bu yönlendirme yalnızca kullanıcı deneyimi içindir.
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.replace("/");
    }
  }, [loading, user, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yetki kontrol ediliyor...</div>
      </Container>
    );
  }

  return (
    <Container className="max-w-5xl">
      <div className="py-4">
        <div className="mb-5 flex items-center gap-2">
          <ShieldIcon className="h-6 w-6 text-brand-300" />
          <h1 className="text-2xl font-extrabold text-white">Admin Paneli</h1>
        </div>

        {/* Sekmeler */}
        <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </Container>
  );
}
