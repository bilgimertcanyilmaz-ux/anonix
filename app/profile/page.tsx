"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { rankIcon, getNextRank, getRankProgress, getRemainingXP } from "@/lib/ranks";
import { getFollowCounts, type FollowCounts } from "@/lib/follows";
import { badgeIcon } from "@/lib/badges";
import { CrownIcon, SparkIcon } from "@/components/ui/icons";
import { ProfileFrame } from "@/components/profile/ProfileFrame";
import { GenderBadge } from "@/components/profile/GenderBadge";
import { ProfileSetup } from "@/components/profile/ProfileSetup";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { SubscriptionFeatures } from "@/components/premium/SubscriptionFeatures";
import { getEffectiveTier, TIER_LABELS } from "@/lib/subscription";
import { Footer } from "@/components/layout/Footer";
import { PushPermissionButton } from "@/components/pwa/PushPermissionButton";
import type { UserBadge } from "@/types";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24, delay: i * 0.07 } }),
};

function StatPill({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <span className="text-xl font-extrabold text-white">{value}</span>
      <span className="text-[11px] text-slate-400">{label}</span>
    </>
  );
  const cls = "glass-card flex flex-col items-center gap-0.5 px-5 py-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-500/50";
  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function ToggleRow({
  title,
  desc,
  on,
  onToggle,
  disabled,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 text-left disabled:opacity-60"
    >
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block text-xs text-slate-400">{desc}</span>
      </span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-brand-500 shadow-glow-sm" : "bg-white/15"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${on ? "translate-x-[22px]" : "translate-x-0.5"}`}
        />
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateProfile, refreshProfile } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const { success: toastSuccess, error: toastErr } = useToast();
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") {
      toastSuccess("Aboneliğin aktif edildi! 👑");
      refreshProfile();
      window.history.replaceState({}, "", "/profile");
    } else if (status === "failed") {
      toastErr("Ödeme tamamlanamadı. Tekrar deneyebilirsin.");
      window.history.replaceState({}, "", "/profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  useEffect(() => { if (user) loadBadges(); }, [user, loadBadges]);
  useEffect(() => { const t = setTimeout(() => setBarReady(true), 200); return () => clearTimeout(t); }, []);

  if (loading || !user) {
    return (
      <Container>
        <div className="py-20 text-center">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-brand-500/20" />
          <p className="mt-4 text-sm text-slate-400">Yükleniyor...</p>
        </div>
      </Container>
    );
  }

  if (!profile) {
    return <Container><ProfileSetup /></Container>;
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

  const tier = getEffectiveTier(profile);
  const next = getNextRank(profile.points);
  const pct = getRankProgress(profile.points);
  const remaining = getRemainingXP(profile.points);
  const isUltra = tier === "ultra_plus";
  const isPlus = tier === "plus";

  return (
    <>
      <Container>
        <div className="space-y-4 py-4">

          {/* ── HERO ─────────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className={`relative overflow-hidden rounded-3xl p-6 ${
              isUltra
                ? "glass-card-gold"
                : "glass-card"
            }`}
          >
            {/* Background glow blobs */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent-500/15 blur-2xl" />
            {isUltra && (
              <div className="pointer-events-none absolute right-8 top-8 h-24 w-24 rounded-full bg-gold-400/25 blur-2xl" />
            )}

            <div className="relative flex items-start gap-4">
              {/* Avatar with glow ring */}
              <div className={`relative shrink-0 ${isUltra ? "aura-gold" : ""}`}>
                <ProfileFrame
                  gender={profile.gender}
                  username={profile.username}
                  avatarUrl={profile.avatar_url}
                  isPlus={profile.is_plus}
                  size="lg"
                />
                {/* Online indicator */}
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-ink-950 bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-extrabold text-white">
                    @{profile.username}
                  </h1>
                  {isUltra && (
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="chip-gold"
                    >
                      <CrownIcon className="h-3 w-3" />
                      ULTRA PLUS
                    </motion.span>
                  )}
                  {isPlus && !isUltra && (
                    <span className="chip-neon">
                      <SparkIcon className="h-3 w-3" />
                      PLUS
                    </span>
                  )}
                  {!isPlus && !isUltra && (
                    <span className="chip text-slate-400">Free</span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <GenderBadge gender={profile.gender} />
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      profile.is_anonymous
                        ? "bg-white/10 text-slate-300"
                        : "bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {profile.is_anonymous ? "🎭 Anonim" : "👁️ Herkese açık"}
                  </span>
                </div>

                {/* Follow stats */}
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <Link href="/profile/followers" className="group flex items-center gap-1 transition-colors hover:text-white">
                    <span className="font-bold text-white group-hover:text-brand-300">{followCounts.followers}</span>
                    <span className="text-slate-400">Takipçi</span>
                  </Link>
                  <div className="h-3 w-px bg-white/10" />
                  <Link href="/profile/following" className="group flex items-center gap-1 transition-colors hover:text-white">
                    <span className="font-bold text-white group-hover:text-brand-300">{followCounts.following}</span>
                    <span className="text-slate-400">Takip</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Rank & XP bar */}
            <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="text-3xl"
                  >
                    {rankIcon(profile.rank)}
                  </motion.span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">Rütbe</p>
                    <p className="text-base font-extrabold text-white">{profile.rank}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/50">Toplam XP</p>
                  <p className="text-lg font-extrabold text-gradient-gold">
                    {profile.points.toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-white/50">
                  <span>{rankIcon(profile.rank)} {profile.rank}</span>
                  {next ? <span>{next.icon} {next.rank}</span> : <span>🏆 Zirve</span>}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-black/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: barReady ? `${pct}%` : "0%" }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className={`h-full rounded-full ${
                      isUltra
                        ? "bg-gradient-to-r from-gold-300 via-gold-400 to-brand-400"
                        : "bg-gradient-to-r from-brand-400 via-brand-500 to-accent-400"
                    }`}
                  />
                </div>
                <p className="text-[10px] text-white/40">
                  {next
                    ? `${remaining.toLocaleString("tr-TR")} XP kaldı · %${pct}`
                    : "Tüm rütbeleri tamamladın!"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── STATS GRID ────────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={1} className="grid grid-cols-3 gap-3">
            <StatPill label="Günlük Streak" value={profile.streak_count} />
            <StatPill label="En Uzun" value={profile.longest_streak} />
            <StatPill label="Davet" value={referralCount} href="/invite" />
          </motion.div>

          {/* ── BADGES ────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Rozetlerim</h2>
              <Link href="/badges" className="text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200">
                Tümünü gör →
              </Link>
            </div>
            {badges.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="text-4xl opacity-50">🏅</span>
                <p className="text-xs text-slate-400">
                  Henüz rozetin yok. İtiraf paylaş, beğen ve rozet kazan!
                </p>
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {badges.map((ub, i) => (
                  <motion.div
                    key={ub.id}
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
                    title={ub.badges?.name ?? ""}
                    className="flex shrink-0 flex-col items-center gap-1"
                  >
                    <span className="flex h-13 w-13 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-2xl shadow-glow-sm">
                      {ub.badges ? badgeIcon(ub.badges) : "🏅"}
                    </span>
                    <span className="max-w-16 truncate text-[10px] text-slate-400">
                      {ub.badges?.name}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── SUBSCRIPTION FEATURES ─────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}>
            <SubscriptionFeatures />
          </motion.div>

          {/* ── AVATAR PICKER ─────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
            <AvatarPicker />
          </motion.div>

          {/* ── MEMBERSHIP CARD ───────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={5}
            className={`glass-card flex items-center justify-between gap-3 p-5 ${
              isUltra ? "glass-card-gold" : ""
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-white">
                Üyelik · <span className={isUltra ? "text-gradient-gold" : isPlus ? "text-gradient" : "text-slate-400"}>{TIER_LABELS[tier]}</span>
              </p>
              <p className="text-xs text-slate-400">
                {isUltra ? "Tüm Ultra Plus özellikleri açık." : isPlus ? "Plus özellikleri açık." : "Premium özellikler kapalı."}
                {profile.plus_expires_at && tier !== "free" && (
                  <> · {new Date(profile.plus_expires_at).toLocaleDateString("tr-TR")} tarihine kadar</>
                )}
              </p>
            </div>
            {isUltra ? (
              <span className="chip-gold">
                <CrownIcon className="h-3.5 w-3.5" />
                Ultra Plus
              </span>
            ) : (
              <LinkButton href="/plus" className="!px-4 !py-2 text-xs">
                {isPlus ? "Ultra Plus'a Geç" : "Plus'a Geç"}
              </LinkButton>
            )}
          </motion.div>

          {/* ── SETTINGS CARDS ────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6} className="glass-card space-y-5 p-5">
            <p className="text-sm font-bold text-white">Gizlilik & Ses</p>
            {error && <Alert tone="error">{error}</Alert>}

            <ToggleRow
              title={`Anonimlik ${profile.is_anonymous ? "açık" : "kapalı"}`}
              desc={profile.is_anonymous ? "Kimliğin gizli, paylaşımların rumuzla görünür." : "Profilin herkese açık görünüyor."}
              on={profile.is_anonymous}
              onToggle={handleToggleAnonymous}
              disabled={toggling}
            />

            <div className="h-px bg-white/5" />

            {(
              [
                { key: "notification_sound_enabled" as const, title: "Bildirim sesi", desc: "Yeni bildirim geldiğinde kısa bir ses çalar." },
                { key: "message_sound_enabled" as const, title: "Mesaj sesi", desc: "Yeni özel mesaj geldiğinde kısa bir ses çalar." },
              ] as const
            ).map((row, i, arr) => (
              <div key={row.key}>
                <ToggleRow
                  title={row.title}
                  desc={row.desc}
                  on={!!profile[row.key]}
                  onToggle={() => updateProfile({ [row.key]: !profile[row.key] })}
                />
                {i < arr.length - 1 && <div className="mt-5 h-px bg-white/5" />}
              </div>
            ))}

            <div className="h-px bg-white/5" />
            <PushPermissionButton />
          </motion.div>

          {/* ── ACCOUNT LINK ──────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={7}>
            <Link
              href="/settings/account"
              className="glass-card glass-card-hover flex items-center justify-between p-5"
            >
              <div>
                <p className="text-sm font-semibold text-white">Hesap Ayarları</p>
                <p className="text-xs text-slate-400">Engellenenler ve hesap silme.</p>
              </div>
              <span className="text-brand-300">→</span>
            </Link>
          </motion.div>

          {/* ── SIGN OUT ──────────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8}>
            <Button variant="ghost" onClick={handleSignOut} className="w-full">
              Çıkış yap
            </Button>
          </motion.div>

        </div>
      </Container>
      <Footer />
    </>
  );
}
