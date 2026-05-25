"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { genderFrameClass, genderLabel, initialsOf } from "@/lib/profile";
import { CrownIcon, SparkIcon } from "@/components/ui/icons";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Giriş yapmamış kullanıcıyı login'e yönlendir.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">
          Profil bilgilerin yükleniyor... Sorun sürerse çıkış yapıp tekrar giriş yap.
        </div>
      </Container>
    );
  }

  async function handleToggleAnonymous() {
    if (!profile) return;
    setError(null);
    setToggling(true);
    const result = await updateProfile({ is_anonymous: !profile.is_anonymous });
    setToggling(false);
    if (result.error) setError(result.error);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <Container>
      <div className="space-y-5 py-4">
        {/* Profil başlık kartı */}
        <div className="card animate-fade-up p-6">
          <div className="flex items-center gap-4">
            {/* Cinsiyete göre çerçeveli avatar */}
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full p-[3px] ${genderFrameClass[profile.gender]}`}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-ink-900 text-xl font-bold text-white">
                {initialsOf(profile.username)}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-extrabold text-white">
                  @{profile.username}
                </h1>
                {profile.is_plus && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-200">
                    <SparkIcon className="h-3 w-3" />
                    PLUS
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-400">{genderLabel[profile.gender]}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  profile.is_anonymous
                    ? "bg-white/10 text-slate-300"
                    : "bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {profile.is_anonymous ? "🎭 Anonim" : "👁️ Herkese açık"}
              </span>
            </div>
          </div>
        </div>

        {/* Puan & rütbe */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">Puan</p>
            <p className="mt-1 text-2xl font-extrabold text-white">{profile.points}</p>
          </div>
          <div className="card p-5">
            <p className="flex items-center gap-1 text-xs uppercase tracking-wider text-slate-500">
              <CrownIcon className="h-3.5 w-3.5" /> Rütbe
            </p>
            <p className="mt-1 text-lg font-extrabold text-gradient">{profile.rank}</p>
          </div>
        </div>

        {/* Üyelik durumu */}
        <div className="card flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-white">Plus üyelik</p>
            <p className="text-xs text-slate-400">
              {profile.is_plus ? "Aktif — tüm premium özellikler açık." : "Henüz aktif değil."}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              profile.is_plus
                ? "bg-brand-500/20 text-brand-200"
                : "bg-white/10 text-slate-400"
            }`}
          >
            {profile.is_plus ? "Aktif" : "Pasif"}
          </span>
        </div>

        {/* Anonimlik aç/kapat */}
        <div className="card p-5">
          {error && (
            <div className="mb-3">
              <Alert tone="error">{error}</Alert>
            </div>
          )}
          <button
            type="button"
            onClick={handleToggleAnonymous}
            disabled={toggling}
            className="flex w-full items-center justify-between text-left disabled:opacity-60"
          >
            <span>
              <span className="block text-sm font-semibold text-white">
                Anonimlik {profile.is_anonymous ? "açık" : "kapalı"}
              </span>
              <span className="block text-xs text-slate-400">
                {profile.is_anonymous
                  ? "Kimliğin gizli, paylaşımların rumuzla görünür."
                  : "Profilin herkese açık görünüyor."}
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                profile.is_anonymous ? "bg-brand-500" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  profile.is_anonymous ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        <Button variant="ghost" onClick={handleSignOut} className="w-full">
          Çıkış yap
        </Button>
      </div>
    </Container>
  );
}
