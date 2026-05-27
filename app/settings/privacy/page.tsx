"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { canUseFeature } from "@/lib/subscription";

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand-500" : "bg-white/15"}`}>
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
      />
    </span>
  );
}

export default function PrivacySettingsPage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile } = useAuth();
  const allowed = canUseFeature(profile, "ghost_mode");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || !profile) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  const rows = [
    {
      key: "ghost_mode" as const,
      title: "Hayalet Mod",
      desc: "Profilleri ziyaret ettiğinde 'kimler baktı' listesinde görünmezsin.",
    },
    {
      key: "hide_online" as const,
      title: "Çevrimiçi durumunu gizle",
      desc: "Diğer kullanıcılar çevrimiçi olduğunu göremez.",
    },
  ];

  return (
    <Container className="max-w-lg">
      <div className="py-4">
        <h1 className="mb-1 text-2xl font-extrabold text-white">Gizlilik</h1>
        <p className="mb-5 text-sm text-slate-400">Gelişmiş gizlilik kontrolleri (Ultra Plus).</p>

        {!allowed && (
          <div className="card mb-4 flex items-center justify-between gap-3 border-amber-400/30 p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <p className="text-sm text-slate-300">Bu ayarlar Ultra Plus ile açılır.</p>
            </div>
            <Link
              href="/plus"
              className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-xs font-bold text-ink-900 shadow-glow"
            >
              Yükselt
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {rows.map((row) => {
            const on = !!profile[row.key];
            return (
              <button
                key={row.key}
                type="button"
                disabled={!allowed}
                onClick={() => updateProfile({ [row.key]: !on })}
                className={`card flex w-full items-center justify-between gap-3 p-5 text-left ${
                  allowed ? "" : "opacity-60"
                }`}
              >
                <span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    {!allowed && <span>🔒</span>}
                    {row.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-400">{row.desc}</span>
                </span>
                <Toggle on={allowed && on} />
              </button>
            );
          })}
        </div>
      </div>
    </Container>
  );
}
