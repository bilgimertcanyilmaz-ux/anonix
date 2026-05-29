"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { CATEGORY_FILTERS } from "@/lib/categories";
import { AdSlot } from "@/components/premium/AdSlot";
import { PlusCircleIcon, TrophyIcon } from "@/components/ui/icons";
import type { ConfessionRecord } from "@/types";

const CONF_SELECT = "*, profiles(username, gender, is_anonymous, avatar_url)";

function SkeletonCard() {
  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-16 animate-pulse rounded-full bg-white/5" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-white/5" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/5" />
      </div>
      <div className="mt-4 flex gap-5">
        <div className="h-5 w-12 animate-pulse rounded-full bg-white/5" />
        <div className="h-5 w-10 animate-pulse rounded-full bg-white/5" />
      </div>
    </div>
  );
}

function EmptyState({ filter, notFollowingAnyone, href }: { filter: ExtendedFilter; notFollowingAnyone: boolean; href: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-center gap-4 py-12 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-3xl shadow-glow-sm"
      >
        {filter === "following" ? "👥" : filter === "today" ? "☀️" : "✨"}
      </motion.div>
      <div>
        <p className="font-semibold text-white">
          {filter === "following"
            ? notFollowingAnyone
              ? "Henüz kimseyi takip etmiyorsun"
              : "Takip ettiklerinden içerik yok"
            : filter === "today"
              ? "Bugün öne çıkan itiraf yok"
              : "Henüz itiraf yok"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {filter === "following"
            ? notFollowingAnyone
              ? "Keşfet'ten ilgini çeken profilleri takip et."
              : "Takip ettiklerinin henüz açık paylaşımı yok."
            : "İlk itirafı sen paylaş!"}
        </p>
      </div>
      {filter !== "following" && (
        <Link
          href={href}
          className="btn-premium px-5 py-2.5 text-sm"
        >
          <PlusCircleIcon className="h-4 w-4" />
          İlk itirafı yaz
        </Link>
      )}
    </motion.div>
  );
}

export default function ConfessionsPage() {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ExtendedFilter>("new");
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFollowingAnyone, setNotFollowingAnyone] = useState(false);

  const night = isNightHours();

  const loadLikes = useCallback(async () => {
    if (!user) { setLikedIds(new Set()); return; }
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
      let followingQuery = supabase
        .from("confessions")
        .select(CONF_SELECT)
        .in("user_id", ids)
        .eq("is_anonymous", false)
        .eq("moderation_status", "approved")
        .or(nonExpiredFilter());
      if (category) followingQuery = followingQuery.or(`category.eq.${category},mood_tag.eq.${category}`);
      const { data, error } = await followingQuery.order("created_at", { ascending: false }).limit(60);
      if (error) { setError("İtiraflar yüklenemedi. Lütfen tekrar dene."); setLoading(false); return; }
      setConfessions(((data as ConfessionRecord[]) ?? []).filter((r) => !blocked.has(r.user_id) && !r.plus_room_type));
      await loadLikes();
      setLoading(false);
      return;
    }

    let query = supabase.from("confessions").select(CONF_SELECT).or(nonExpiredFilter());
    if (category) query = query.or(`category.eq.${category},mood_tag.eq.${category}`);
    if (filter === "likes") query = query.order("like_count", { ascending: false });
    else if (filter === "comments") query = query.order("comment_count", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query.limit(60);
    if (error) { setError("İtiraflar yüklenemedi. Lütfen tekrar dene."); setLoading(false); return; }
    let rows = (data as ConfessionRecord[]) ?? [];
    rows = rows.filter(
      (r) => (r.moderation_status ?? "approved") === "approved" && !blocked.has(r.user_id) && !r.plus_room_type
    );
    if (filter === "trend") rows = sortByTrend(rows);
    else if (filter === "hot") rows = sortByHot(rows);
    else if (filter === "today") rows = sortByHot(rows.filter((r) => isFromToday(r.created_at)));
    else if (filter === "new" && user) rows = await getExploreFeed(user.id, rows);

    setConfessions(rows.slice(0, 50));
    await loadLikes();
    setLoading(false);
  }, [user, filter, category, loadLikes]);

  useEffect(() => { load(); }, [load]);

  return (
    <Container>
      <div className="py-4">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        {night ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-5 overflow-hidden rounded-3xl border border-brand-500/30 p-5"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.35) 0%, rgba(15,10,30,0.9) 100%)",
              boxShadow: "0 0 40px -8px rgba(124,58,237,0.4)",
            }}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-400/20 blur-3xl" />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-extrabold text-gradient">🌙 Gece İtirafları</h1>
                <p className="text-xs text-brand-200/60">Gecenin sessizliğinde, daha derin itiraflar.</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href="/leaderboard"
                  aria-label="Liderlik tablosu"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/40 bg-gradient-to-br from-gold-500/20 to-brand-500/20 text-gold-300 shadow-glow-sm transition-transform active:scale-95"
                >
                  <TrophyIcon className="h-4.5 w-4.5" />
                </Link>
                <LinkButton href="/confessions/new" className="!px-3.5 !py-1.5 text-xs">
                  <PlusCircleIcon className="h-3.5 w-3.5" />
                  İtiraf Yaz
                </LinkButton>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 flex items-center justify-between gap-3"
          >
            <div>
              <h1 className="text-2xl font-extrabold text-white">Keşfet</h1>
              <p className="text-xs text-slate-500">Anonim itiraflar, gerçek hisler</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/leaderboard"
                aria-label="Liderlik tablosu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gold-400/40 bg-gradient-to-br from-gold-500/20 to-brand-500/20 text-gold-300 shadow-glow-sm transition-transform active:scale-95"
              >
                <TrophyIcon className="h-5 w-5" />
              </Link>
              <LinkButton href="/confessions/new" className="!px-3.5 !py-1.5 text-xs">
                <PlusCircleIcon className="h-3.5 w-3.5" />
                İtiraf Yaz
              </LinkButton>
            </div>
          </motion.div>
        )}

        {/* ── FILTER TABS ────────────────────────────────────────── */}
        <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {extendedFilters.map((f, i) => (
            <motion.button
              key={f.value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setFilter(f.value)}
              className={`relative shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                filter === f.value
                  ? "border-brand-500/60 bg-brand-500/20 text-brand-100 shadow-glow-sm"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
              }`}
            >
              {filter === f.value && (
                <motion.span
                  layoutId="filterActive"
                  className="absolute inset-0 rounded-full bg-brand-500/15"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </motion.button>
          ))}
        </div>

        {/* ── CATEGORY FILTER ────────────────────────────────────── */}
        <div className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORY_FILTERS.map((c, i) => {
            const active = category === c.value;
            return (
              <motion.button
                key={c.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.03 }}
                onClick={() => setCategory(c.value)}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                  active
                    ? "border-brand-500/50 bg-brand-500/15 text-brand-200 shadow-glow-sm"
                    : "border-white/10 bg-white/[0.02] text-slate-500 hover:bg-white/[0.05] hover:text-slate-300"
                }`}
              >
                {c.label}
              </motion.button>
            );
          })}
        </div>

        {/* ── FEED ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="glass-card p-6 text-center text-sm text-red-300">{error}</div>
        ) : confessions.length === 0 ? (
          <EmptyState filter={filter} notFollowingAnyone={notFollowingAnyone} href="/confessions/new" />
        ) : (
          <div className="space-y-4">
            {confessions.map((c, i) => (
              <div key={c.id} className="space-y-4">
                <FeedCard confession={c} liked={likedIds.has(c.id)} />
                {i > 0 && (i + 1) % 6 === 0 && <AdSlot />}
              </div>
            ))}
          </div>
        )}

      </div>
    </Container>
  );
}
