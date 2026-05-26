"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { rankIcon, getNextRank, getRankProgress, getRemainingXP } from "@/lib/ranks";
import { getFollowCounts, type FollowCounts } from "@/lib/follows";
import { badgeIcon } from "@/lib/badges";
import { CrownIcon } from "@/components/ui/icons";
import { ProfileFrame } from "@/components/profile/ProfileFrame";
import { GenderBadge } from "@/components/profile/GenderBadge";
import { ProfileSetup } from "@/components/profile/ProfileSetup";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { Footer } from "@/components/layout/Footer";
import type { UserBadge } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateProfile } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [barReady, setBarReady] = useState(false);

  // Giriş yapmamış kullanıcıyı login'e yönlendir.
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const loadBadges = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_badges")
      .select("*, badges(*)")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });
    setBadges((data as UserBadge[]) ?? []);

    const { count } = await supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", user.id);
    setReferralCount(count ?? 0);

    setFollowCounts(await getFollowCounts(user.id));
  }, [user]);

  useEffect(() => {
    if (user) loadBadges();
  }, [user, loadBadges]);

  // XP barını mount sonrası 0'dan hedefe doğru animasyonla doldur
  useEffect(() => {
    const t = setTimeout(() => setBarReady(true), 150);
    return () => clearTimeout(t);
  }, []);

  if (loading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  // Giriş yapılmış ama profil kaydı yoksa: onboarding (profil oluşturma) ekranı.
  if (!profile) {
    return (
      <Container>
        <ProfileSetup />
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
    <>
      <Container>
      <div className="space-y-5 py-4">
        {/* Profil başlık kartı */}
        <div className="card animate-fade-up p-6">
          <div className="flex items-center gap-4">
            {/* Cinsiyete göre çerçeveli avatar */}
            <ProfileFrame
              gender={profile.gender}
              username={profile.username}
              avatarUrl={profile.avatar_url}
              isPlus={profile.is_plus}
              size="lg"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-extrabold text-white">
                  @{profile.username}
                </h1>
                {profile.is_plus && (
                  <span className="inline-flex animate-float items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2 py-0.5 text-[10px] font-bold text-ink-900 shadow-glow">
                    <CrownIcon className="h-3 w-3" />
                    PLUS
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <GenderBadge gender={profile.gender} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <Link href="/profile/followers" className="transition-colors hover:text-white">
                  <span className="font-bold text-white">{followCounts.followers}</span> Takipçi
                </Link>
                <Link href="/profile/following" className="transition-colors hover:text-white">
                  <span className="font-bold text-white">{followCounts.following}</span> Takip
                </Link>
              </div>
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

        {/* XP & rütbe — dikkat çekici hero */}
        {(() => {
          const next = getNextRank(profile.points);
          const pct = getRankProgress(profile.points);
          const remaining = getRemainingXP(profile.points);
          return (
            <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-600 via-brand-800 to-ink-900 p-6 shadow-glow">
              <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-400/20 blur-3xl" />
              <div className="relative flex items-center gap-4">
                <span className="animate-float text-5xl">{rankIcon(profile.rank)}</span>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-white/60">Rütbe</p>
                  <p className="text-2xl font-extrabold text-white">{profile.rank}</p>
                  <p className="mt-0.5 text-sm font-semibold text-amber-200">
                    {profile.points.toLocaleString("tr-TR")} XP
                  </p>
                </div>
              </div>

              <div className="relative mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs text-white/70">
                  <span>{rankIcon(profile.rank)} {profile.rank}</span>
                  {next ? (
                    <span>{next.icon} {next.rank}</span>
                  ) : (
                    <span>En üst rütbe 🏆</span>
                  )}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-black/30">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-[1200ms] ease-out"
                    style={{ width: `${barReady ? pct : 0}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/60">
                  {next
                    ? `Sonraki rütbeye ${remaining.toLocaleString("tr-TR")} XP kaldı (%${pct})`
                    : "Tüm rütbeleri tamamladın!"}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Avatar seçimi */}
        <AvatarPicker />

        {/* Streak + davet istatistikleri */}
        <div className="grid grid-cols-3 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-white">🔥 {profile.streak_count}</p>
            <p className="text-[11px] text-slate-400">Günlük streak</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{profile.longest_streak}</p>
            <p className="text-[11px] text-slate-400">En uzun streak</p>
          </div>
          <Link href="/invite" className="card card-hover p-4 text-center">
            <p className="text-2xl font-extrabold text-white">🎁 {referralCount}</p>
            <p className="text-[11px] text-slate-400">Davet · davet et →</p>
          </Link>
        </div>

        {/* Rozetler */}
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Rozetlerim</h2>
            <Link href="/badges" className="text-xs font-medium text-brand-300 hover:text-brand-200">
              Tümünü gör →
            </Link>
          </div>
          {badges.length === 0 ? (
            <p className="text-xs text-slate-400">
              Henüz rozetin yok. İtiraf paylaş, beğen, yorum yap ve rozet kazan!
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {badges.map((ub) => (
                <div
                  key={ub.id}
                  title={ub.badges?.name ?? ""}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-2xl">
                    {ub.badges ? badgeIcon(ub.badges) : "🏅"}
                  </span>
                  <span className="max-w-16 truncate text-[10px] text-slate-400">
                    {ub.badges?.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Üyelik durumu */}
        <div className="card flex items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold text-white">Plus üyelik</p>
            <p className="text-xs text-slate-400">
              {profile.is_plus ? "Aktif — tüm premium özellikler açık." : "Henüz aktif değil."}
            </p>
          </div>
          {profile.is_plus ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300/20 to-brand-500/20 px-3 py-1 text-xs font-bold text-amber-200">
              <CrownIcon className="h-3.5 w-3.5" />
              Plus Üye
            </span>
          ) : (
            <LinkButton href="/plus" className="!px-4 !py-2 text-xs">
              Plus'a Geç
            </LinkButton>
          )}
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

        {/* Ses ayarları */}
        <div className="card space-y-4 p-5">
          <p className="text-sm font-bold text-white">Ses ayarları</p>
          {(
            [
              {
                key: "notification_sound_enabled" as const,
                title: "Bildirim sesi",
                desc: "Yeni bildirim geldiğinde kısa bir ses çalar.",
              },
              {
                key: "message_sound_enabled" as const,
                title: "Mesaj sesi",
                desc: "Yeni özel mesaj geldiğinde kısa bir ses çalar.",
              },
            ]
          ).map((row) => {
            const on = profile[row.key];
            return (
              <button
                key={row.key}
                type="button"
                onClick={() => updateProfile({ [row.key]: !on })}
                className="flex w-full items-center justify-between text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-white">{row.title}</span>
                  <span className="block text-xs text-slate-400">{row.desc}</span>
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    on ? "bg-brand-500" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      on ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <Button variant="ghost" onClick={handleSignOut} className="w-full">
          Çıkış yap
        </Button>
      </div>
      </Container>
      <Footer />
    </>
  );
}
