"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { FeedCard } from "@/components/confession/FeedCard";
import { GolgeCard } from "@/components/golge/GolgeCard";
import { useAuth } from "@/components/auth/AuthProvider";
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
  { href: "/confessions/new", label: "İtiraf Yaz", Icon: PlusCircleIcon, tint: "text-brand-300" },
  { href: "/golge/new", label: "Gölge Paylaş", Icon: MoonIcon, tint: "text-indigo-300" },
  { href: "/confessions", label: "Trendleri Gör", Icon: FireIcon, tint: "text-orange-300" },
] as const;

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

  return (
    <div className="space-y-6 py-4">
      {/* Hoş geldin */}
      <section className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-600 via-brand-800 to-ink-900 p-6 shadow-glow">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-white/60">Anonix</p>
            <h1 className="truncate text-2xl font-extrabold text-white">
              Tekrar hoş geldin, {username} 👋
            </h1>
            <p className="mt-1 text-sm text-white/70">
              {profile?.is_anonymous
                ? "Bugün anonim kalmak ister misin? Kimliğin gizli, sözün özgür."
                : "Bugün içini dökmeye hazır mısın?"}
            </p>
          </div>
          {profile?.is_plus && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 py-1 text-[11px] font-bold text-ink-900 shadow-glow">
              <CrownIcon className="h-3.5 w-3.5" />
              PLUS
            </span>
          )}
        </div>
      </section>

      {/* Hızlı aksiyonlar */}
      <section>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, label, Icon, tint }) => (
            <Link
              key={href}
              href={href}
              className="card card-hover flex flex-col items-center gap-2 p-4 text-center"
            >
              <Icon className={`h-6 w-6 ${tint}`} />
              <span className="text-xs font-semibold text-slate-200">{label}</span>
            </Link>
          ))}
          {profile?.is_plus ? (
            <Link
              href="/plus"
              className="card card-hover flex flex-col items-center gap-2 border-amber-300/30 bg-amber-300/[0.06] p-4 text-center"
            >
              <CrownIcon className="h-6 w-6 text-amber-300" />
              <span className="text-xs font-semibold text-amber-200">Plus Üye</span>
            </Link>
          ) : (
            <Link
              href="/plus"
              className="card card-hover flex flex-col items-center gap-2 border-brand-500/30 bg-brand-500/[0.08] p-4 text-center"
            >
              <CrownIcon className="h-6 w-6 text-amber-300" />
              <span className="text-xs font-semibold text-brand-100">Plus'a Geç</span>
            </Link>
          )}
        </div>
      </section>

      {error && (
        <div className="card border-red-500/30 bg-red-500/[0.06] p-4 text-center text-sm text-red-200">
          {error}
        </div>
      )}

      {/* Günlük görev kısa kartı */}
      {taskSummary && taskSummary.total > 0 && (
        <Link
          href="/tasks"
          className="card card-hover flex items-center justify-between gap-3 p-4"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/15">
              <TargetIcon className="h-5 w-5 text-brand-300" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Günlük görevler</p>
              <p className="text-xs text-slate-400">
                {taskSummary.completed}/{taskSummary.total} tamamlandı
                {taskSummary.rewardLeft > 0 && ` · +${taskSummary.rewardLeft} puan seni bekliyor`}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-sm text-brand-300">→</span>
        </Link>
      )}

      {/* Takip edilenlerin son itirafları */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Takip ettiklerin</h2>
        {loading ? (
          <SkeletonList count={2} />
        ) : followed.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-400">
            Henüz kimseyi takip etmiyorsun.{" "}
            <Link href="/confessions" className="font-semibold text-brand-300 hover:text-brand-200">
              Trend itiraflardan
            </Link>{" "}
            başlayabilirsin.
          </div>
        ) : (
          <div className="space-y-4">
            {followed.map((c) => (
              <FeedCard key={c.id} confession={c} liked={likedConf.has(c.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Trend itiraflar */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">🔥 Trend itiraflar</h2>
          <Link href="/confessions" className="text-xs font-medium text-brand-300 hover:text-brand-200">
            Tümünü gör →
          </Link>
        </div>
        {loading ? (
          <SkeletonList count={3} />
        ) : trending.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-400">
            Henüz itiraf yok. İlk itirafı sen paylaş!
          </div>
        ) : (
          <div className="space-y-4">
            {trending.map((c) => (
              <FeedCard key={c.id} confession={c} liked={likedConf.has(c.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Gölge önerileri */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Gölge önerileri</h2>
          <Link href="/golge" className="text-xs font-medium text-brand-300 hover:text-brand-200">
            Tümünü gör →
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : golge.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-400">
            Henüz Gölge paylaşımı yok.{" "}
            <Link href="/golge/new" className="font-semibold text-brand-300 hover:text-brand-200">
              İlkini sen paylaş.
            </Link>
          </div>
        ) : (
          <div className="columns-2 gap-3">
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
