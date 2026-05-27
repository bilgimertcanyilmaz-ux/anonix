"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { canUseFeature } from "@/lib/subscription";
import { PREMIUM_THEMES } from "@/lib/themes";

export default function ThemesSettingsPage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const allowed = canUseFeature(profile, "premium_themes");

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

  const current = profile.premium_theme;

  async function pick(id: string | null) {
    const res = await updateProfile({ premium_theme: id });
    if (res.error) toastError("Tema kaydedilemedi.");
    else success(id ? "Premium tema uygulandı 🎨" : "Tema kaldırıldı");
  }

  return (
    <Container className="max-w-lg">
      <div className="py-4">
        <h1 className="mb-1 text-2xl font-extrabold text-white">Premium Temalar</h1>
        <p className="mb-5 text-sm text-slate-400">
          Profil çerçeveni glow efektli premium temalarla kişiselleştir (Ultra Plus).
        </p>

        {!allowed && (
          <div className="card mb-4 flex items-center justify-between gap-3 border-amber-400/30 p-4">
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <span>🔒</span> Premium temalar Ultra Plus ile açılır.
            </span>
            <Link href="/plus" className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-xs font-bold text-ink-900 shadow-glow">
              Yükselt
            </Link>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PREMIUM_THEMES.map((t) => {
            const selected = current === t.id;
            return (
              <button
                key={t.id}
                type="button"
                disabled={!allowed}
                onClick={() => pick(t.id)}
                className={`card flex flex-col items-center gap-2 p-4 transition-all disabled:opacity-50 ${
                  selected ? "ring-2 ring-brand-500" : ""
                }`}
              >
                <span className={`h-12 w-12 rounded-full p-[3px] ${t.preview}`}>
                  <span className="block h-full w-full rounded-full bg-ink-900" />
                </span>
                <span className="text-xs font-semibold text-white">{t.name}</span>
                {selected && <span className="text-[10px] text-brand-300">Seçili</span>}
              </button>
            );
          })}
        </div>

        {allowed && current && (
          <button
            onClick={() => pick(null)}
            className="mt-4 text-xs font-medium text-slate-400 hover:text-white"
          >
            Temayı kaldır
          </button>
        )}
      </div>
    </Container>
  );
}
