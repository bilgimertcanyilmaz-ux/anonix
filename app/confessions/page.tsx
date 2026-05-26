"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";
import { FeedCard } from "@/components/confession/FeedCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { sortByTrend } from "@/lib/trending";
import {
  extendedFilters,
  type ExtendedFilter,
  sortByHot,
  isFromToday,
  isNightHours,
  nonExpiredFilter,
} from "@/lib/feeds";
import { getExploreFeed } from "@/lib/recommendations";
import { getBlockedIds } from "@/lib/blocks";
import { PlusCircleIcon, TrophyIcon } from "@/components/ui/icons";
import type { ConfessionRecord } from "@/types";

const CONF_SELECT = "*, profiles(username, gender, is_anonymous, avatar_url)";

export default function ConfessionsPage() {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ExtendedFilter>("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFollowingAnyone, setNotFollowingAnyone] = useState(false);

  const night = isNightHours();

  const loadLikes = useCallback(async () => {
    if (!user) {
      setLikedIds(new Set());
      return;
    }
    const { data: likes } = await supabase
      .from("confession_likes")
      .select("confession_id")
      .eq("user_id", user.id);
    setLikedIds(new Set((likes ?? []).map((l) => l.confession_id as string)));
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFollowingAnyone(false);

    const blocked = user ? await getBlockedIds(user.id) : new Set<string>();

    // --- Takip Ettiklerim: yalnızca takip edilenlerin AÇIK paylaşımları ---
    if (filter === "following") {
      if (!user) {
        setConfessions([]);
        setNotFollowingAnyone(true);
        setLoading(false);
        return;
      }
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const ids = (follows ?? []).map((f) => f.following_id as string);
      if (ids.length === 0) {
        setConfessions([]);
        setNotFollowingAnyone(true);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("confessions")
        .select(CONF_SELECT)
        .in("user_id", ids)
        .eq("is_anonymous", false)
        .eq("moderation_status", "approved")
        .or(nonExpiredFilter())
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) {
        setError("İtiraflar yüklenemedi. Lütfen tekrar dene.");
        setLoading(false);
        return;
      }
      setConfessions(((data as ConfessionRecord[]) ?? []).filter((r) => !blocked.has(r.user_id)));
      await loadLikes();
      setLoading(false);
      return;
    }

    // --- Diğer filtreler ---
    let query = supabase.from("confessions").select(CONF_SELECT).or(nonExpiredFilter());
    if (filter === "likes") query = query.order("like_count", { ascending: false });
    else if (filter === "comments") query = query.order("comment_count", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query.limit(60);
    if (error) {
      setError("İtiraflar yüklenemedi. Lütfen tekrar dene.");
      setLoading(false);
      return;
    }
    let rows = (data as ConfessionRecord[]) ?? [];

    // Yalnızca onaylı içerik + engellenenleri gizle
    rows = rows.filter(
      (r) => (r.moderation_status ?? "approved") === "approved" && !blocked.has(r.user_id)
    );

    if (filter === "trend") rows = sortByTrend(rows);
    else if (filter === "hot") rows = sortByHot(rows);
    else if (filter === "today") rows = sortByHot(rows.filter((r) => isFromToday(r.created_at)));
    else if (filter === "new" && user) {
      // Giriş yapan kullanıcı için kişiselleştirilmiş Keşfet akışı
      rows = await getExploreFeed(user.id, rows);
    }

    setConfessions(rows.slice(0, 50));
    await loadLikes();
    setLoading(false);
  }, [user, filter, loadLikes]);

  useEffect(() => {
    load();
  }, [load]);

  const leaderboardBtn = (
    <Link
      href="/leaderboard"
      aria-label="Liderlik tablosu"
      title="Liderlik"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-brand-600 text-white shadow-glow transition-transform active:scale-95"
    >
      <TrophyIcon className="h-5 w-5" />
    </Link>
  );

  return (
    <Container>
      <div className="py-4">
        {/* Üst bar: Sol başlık · Orta liderlik · Sağ İtiraf Yaz */}
        {night ? (
          <div className="mb-5 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-700/40 to-ink-900 p-5 shadow-glow">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-gradient">🌙 Gece İtirafları</h1>
                <p className="text-xs text-brand-200/70">Gecenin sessizliğinde, daha derin itiraflar.</p>
              </div>
              {leaderboardBtn}
              <LinkButton href="/confessions/new" className="!px-4 !py-2 text-xs">
                <PlusCircleIcon className="h-4 w-4" />
                İtiraf Yaz
              </LinkButton>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold text-white">Keşfet</h1>
            {leaderboardBtn}
            <LinkButton href="/confessions/new" className="!px-4 !py-2 text-xs">
              <PlusCircleIcon className="h-4 w-4" />
              İtiraf Yaz
            </LinkButton>
          </div>
        )}

        {/* Genişletilmiş filtre sekmeleri (yatay kaydırılabilir) */}
        <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
          {extendedFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === f.value
                  ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-36 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-center text-sm text-red-200">{error}</div>
        ) : confessions.length === 0 ? (
          <div className="card p-8 text-center">
            {filter === "following" ? (
              <p className="text-sm text-slate-400">
                {notFollowingAnyone
                  ? "Henüz kimseyi takip etmiyorsun. Keşfet'ten ilgini çeken profilleri takip edebilirsin."
                  : "Takip ettiklerinin henüz açık paylaşımı yok."}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-400">
                  {filter === "today"
                    ? "Bugün henüz öne çıkan itiraf yok."
                    : "Henüz hiç itiraf yok. İlk itirafı sen paylaş!"}
                </p>
                <div className="mt-4">
                  <LinkButton href="/confessions/new">İlk itirafı yaz</LinkButton>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {confessions.map((c) => (
              <FeedCard key={c.id} confession={c} liked={likedIds.has(c.id)} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
