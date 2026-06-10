"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { FeedCard } from "@/components/confession/FeedCard";
import { GolgeCard } from "@/components/golge/GolgeCard";
import { FramedAvatar } from "@/components/profile/FramedAvatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSubscriptionTier } from "@/lib/subscription";
import { rankIcon, getNextRank, getRankProgress, getRemainingXP } from "@/lib/ranks";
import {
  fetchTrendingConfessions,
  fetchFollowedConfessions,
  fetchGolgeSuggestions,
  fetchDailyTaskSummary,
  fetchLikedConfessionIds,
  fetchLikedGolgeIds,
  type DailyTaskSummary,
} from "@/lib/home";
import {
  PlusCircleIcon,
  MoonIcon,
  FireIcon,
  CrownIcon,
  TargetIcon,
} from "@/components/ui/icons";
import type { ConfessionRecord, GolgePost } from "@/types";

const QUICK_ACTIONS = [
  {
    href: "/confessions/new",
    label: "İtiraf Yaz",
    Icon: PlusCircleIcon,
    tint: "text-brand-300",
    bubble: "bg-brand-500/15",
    glow: "rgba(168,85,247,0.35)",
  },
  {
    href: "/golge/new",
    label: "Gölge Paylaş",
    Icon: MoonIcon,
    tint: "text-indigo-300",
    bubble: "bg-indigo-500/15",
    glow: "rgba(99,102,241,0.35)",
  },
  {
    href: "/confessions",
    label: "Trendleri Gör",
    Icon: FireIcon,
    tint: "text-orange-300",
    bubble: "bg-orange-500/15",
    glow: "rgba(249,115,22,0.35)",
  },
] as const;

/** Saate göre selamlama (yalnızca istemcide, auth sonrası render edilir). */
function greetingFor(hour: number): string {
  if (hour < 6) return "İyi geceler";
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}

/** Bölüm başlığı — emoji rozetli, sağda opsiyonel "Tümünü gör". */
function SectionHeader({
  emoji,
  title,
  href,
}: {
  emoji: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm">
          {emoji}
        </span>
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="group text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200"
        >
          Tümünü gör{" "}
          <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      )}
    </div>
  );
}

/** Giriş yapmış kullanıcı için kişiselleştirilmiş ana sayfa (dashboard). */
export function AuthHome() {
  const { user, profile } = useAuth();

  const [trending, setTrending] = useState<ConfessionRecord[]>([]);
  const [followed, setFollowed] = useState<ConfessionRecord[]>([]);
  const [golge, setGolge] = useState<GolgePost[]>([]);
  const [likedConf, setLikedConf] = useState<Set<string>>(new Set());
  const [likedGolge, setLikedGolge] = useState<Set<string>>(new Set());
  const [taskSummary, setTaskSummary] = useState<DailyTaskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [trend, follow, golgeList, likedC, likedG, summary] = await Promise.all([
        fetchTrendingConfessions(5),
        fetchFollowedConfessions(user.id, 5),
        fetchGolgeSuggestions(4),
        fetchLikedConfessionIds(user.id),
        fetchLikedGolgeIds(user.id),
        fetchDailyTaskSummary(user.id),
      ]);
      setTrending(trend);
      setFollowed(follow);
      setGolge(golgeList);
      setLikedConf(likedC);
      setLikedGolge(likedG);
      setTaskSummary(summary);
    } catch {
      setError("Akış yüklenirken bir sorun oluştu. Lütfen sayfayı yenile.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const username = profile?.username ?? "tekrar";
  const tier = getSubscriptionTier(profile);
  const points = profile?.points ?? 0;
  const streak = profile?.streak_count ?? 0;
  const nextRank = getNextRank(points);
  const rankPct = getRankProgress(points);
  const remainingXP = getRemainingXP(points);
  const greeting = greetingFor(new Date().getHours());
  const taskPct = taskSummary && taskSummary.total > 0
    ? Math.round((taskSummary.completed / taskSummary.total) * 100)
    : 0;

  return (
    <div className="space-y-6 py-4">
      {/* ── HOŞ GELDİN HERO ─────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        className="anonix-dark-card relative overflow-hidden rounded-3xl border border-brand-500/30 p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.5) 0%, rgba(76,29,149,0.55) 40%, rgba(15,12,36,0.92) 100%)",
          boxShadow: "0 0 50px -14px rgba(124,58,237,0.5), 0 24px 50px -24px rgba(0,0,0,0.7)",
        }}
      >
        {/* Aurora ışıkları */}
        <motion.div
          aria-hidden
          animate={{ x: [0, 18, 0], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -right-12 -top-14 h-44 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(236,72,153,0.3), transparent 70%)" }}
        />
        <motion.div
          aria-hidden
          animate={{ x: [0, -14, 0], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="pointer-events-none absolute -bottom-16 left-1/4 h-40 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(96,165,250,0.22), transparent 70%)" }}
        />

        <div className="relative flex items-start gap-4">
          {/* Avatar (premium çerçeve destekli) */}
          <div className="shrink-0">
            {profile?.premium_theme ? (
              <FramedAvatar themeId={profile.premium_theme} size={72}>
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-accent-500 text-xl font-extrabold text-white">
                    {username[0]?.toUpperCase()}
                  </div>
                )}
              </FramedAvatar>
            ) : (
              <div className="overflow-hidden rounded-full p-[2.5px]" style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}>
                <div className="h-14 w-14 overflow-hidden rounded-full bg-ink-950">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-accent-500 text-xl font-extrabold text-white">
                      {username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  {greeting}
                </p>
                <h1 className="truncate text-xl font-extrabold text-white sm:text-2xl">
                  {username} 👋
                </h1>
              </div>
              {tier === "ultra_plus" ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink-900 shadow-glow-gold">
                  <CrownIcon className="h-3 w-3" /> Ultra
                </span>
              ) : tier === "plus" ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-500/30 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-brand-100 ring-1 ring-inset ring-brand-400/50">
                  <CrownIcon className="h-3 w-3" /> Plus
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-white/65 sm:text-sm">
              {profile?.is_anonymous
                ? "Kimliğin gizli, sözün özgür. Bugün içini dök."
                : "Bugün içini dökmeye hazır mısın?"}
            </p>

            {/* Mini istatistikler */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                ⭐ {points.toLocaleString("tr-TR")} puan
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                {rankIcon(profile?.rank ?? "")} {profile?.rank}
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-1 text-[11px] font-bold text-orange-200 ring-1 ring-inset ring-orange-400/30">
                  🔥 {streak} gün seri
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Rütbe ilerleme çubuğu */}
        {nextRank && (
          <div className="relative mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="font-semibold text-white/60">
                Sonraki rütbe: {rankIcon(nextRank.rank)} {nextRank.rank}
              </span>
              <span className="font-bold text-brand-200">
                {remainingXP.toLocaleString("tr-TR")} puan kaldı
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rankPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #a855f7, #ec4899, #fbbf24)",
                  boxShadow: "0 0 12px rgba(236,72,153,0.5)",
                }}
              />
            </div>
          </div>
        )}
      </motion.section>

      {/* ── HIZLI AKSİYONLAR ────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map(({ href, label, Icon, tint, bubble, glow }, i) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
          >
            <Link
              href={href}
              className="card group flex flex-col items-center gap-2.5 p-4 text-center transition-all duration-300 hover:-translate-y-1"
              style={{ ["--qa-glow" as string]: glow }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px -12px ${glow}`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "";
              }}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${bubble} transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className={`h-5 w-5 ${tint}`} />
              </span>
              <span className="text-xs font-semibold text-slate-200">{label}</span>
            </Link>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, type: "spring", stiffness: 260, damping: 22 }}
        >
          <Link
            href="/plus"
            className={`card group flex flex-col items-center gap-2.5 p-4 text-center transition-all duration-300 hover:-translate-y-1 ${
              tier !== "free"
                ? "border-amber-300/30 bg-amber-300/[0.06]"
                : "border-brand-500/30 bg-brand-500/[0.08]"
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/15 transition-transform duration-300 group-hover:scale-110">
              <CrownIcon className="h-5 w-5 text-amber-300" />
            </span>
            <span
              className={`text-xs font-semibold ${tier !== "free" ? "text-amber-200" : "text-brand-100"}`}
            >
              {tier === "ultra_plus" ? "Ultra Üye" : tier === "plus" ? "Plus Üye" : "Plus'a Geç"}
            </span>
          </Link>
        </motion.div>
      </section>

      {error && (
        <div className="card flex flex-col items-center gap-3 border-red-500/30 bg-red-500/[0.06] p-4 text-center text-sm text-red-200">
          <span>{error}</span>
          <button type="button" onClick={() => load()} className="btn-ghost px-5 py-2 text-xs">
            ↻ Tekrar dene
          </button>
        </div>
      )}

      {/* ── GÜNLÜK GÖREVLER ─────────────────────────────────────── */}
      {taskSummary && taskSummary.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Link href="/tasks" className="card card-hover block p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-500/15">
                  <TargetIcon className="h-5 w-5 text-brand-300" />
                  {taskSummary.completed === taskSummary.total && (
                    <span className="absolute -right-1 -top-1 text-xs">✅</span>
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">Günlük görevler</p>
                  <p className="truncate text-xs text-slate-400">
                    {taskSummary.completed}/{taskSummary.total} tamamlandı
                    {taskSummary.rewardLeft > 0 && ` · +${taskSummary.rewardLeft} puan seni bekliyor`}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold text-brand-300">{taskPct}%</span>
            </div>
            {/* Görev ilerleme çubuğu */}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(taskPct, 4)}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
              />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── TAKİP ETTİKLERİN ────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader emoji="👥" title="Takip ettiklerin" />
        {loading ? (
          <SkeletonList count={2} />
        ) : followed.length === 0 ? (
          <EmptyState
            icon="👥"
            title="Henüz kimseyi takip etmiyorsun"
            description="Trend itiraflardan ilgini çeken yazarları takip et, akışın burada canlansın."
            actionLabel="Trend itiraflara göz at"
            actionHref="/confessions"
          />
        ) : (
          <div className="space-y-4">
            {followed.map((c) => (
              <FeedCard key={c.id} confession={c} liked={likedConf.has(c.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ── TREND İTİRAFLAR ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader emoji="🔥" title="Trend itiraflar" href="/confessions" />
        {loading ? (
          <SkeletonList count={3} />
        ) : trending.length === 0 ? (
          <EmptyState
            icon="🔥"
            title="Henüz itiraf yok"
            description="İlk itirafı sen paylaş, trendleri sen başlat."
            actionLabel="İtiraf yaz"
            actionHref="/confessions/new"
          />
        ) : (
          <div className="space-y-4">
            {trending.map((c) => (
              <FeedCard key={c.id} confession={c} liked={likedConf.has(c.id)} />
            ))}
          </div>
        )}
      </section>

      {/* ── GÖLGE ÖNERİLERİ ─────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader emoji="🌙" title="Gölge önerileri" href="/golge" />
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : golge.length === 0 ? (
          <EmptyState
            icon="🌙"
            title="Henüz Gölge paylaşımı yok"
            description="Bir fotoğrafın üstüne duygunu yaz, Gölge akışını sen başlat."
            actionLabel="İlkini sen paylaş"
            actionHref="/golge/new"
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {golge.map((p) => (
              <GolgeCard key={p.id} post={p} liked={likedGolge.has(p.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card h-36 animate-pulse" />
      ))}
    </div>
  );
}
