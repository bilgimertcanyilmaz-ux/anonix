"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";
import { GolgeExploreTile } from "@/components/golge/GolgeExploreTile";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBlockedIds } from "@/lib/blocks";
import { sortByTrend, type FeedFilter } from "@/lib/trending";
import { PlusCircleIcon } from "@/components/ui/icons";
import type { GolgePost } from "@/types";

const PAGE_SIZE = 18;

function isLarge(index: number): boolean {
  return index % 7 === 0;
}

function GolgeSkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-1 [grid-auto-flow:dense]">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse overflow-hidden rounded-lg bg-white/[0.06] ${
            i % 7 === 0 ? "col-span-2 row-span-2" : ""
          }`}
          style={{ aspectRatio: i % 7 === 0 ? undefined : "1" }}
        >
          {i % 7 === 0 && <div className="h-full min-h-[160px]" />}
        </div>
      ))}
    </div>
  );
}

export default function GolgeFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<GolgePost[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FeedFilter>("new");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (pageIndex: number) => {
      const from = pageIndex * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from("golge_posts")
        .select("*, profiles(username, gender, is_anonymous, avatar_url, premium_theme)")
        .eq("moderation_status", "approved");
      if (filter === "likes") query = query.order("like_count", { ascending: false });
      else if (filter === "comments") query = query.order("comment_count", { ascending: false });
      else query = query.order("created_at", { ascending: false });
      const { data, error } = await query.range(from, to);
      if (error) { setError("Gölge akışı yüklenemedi."); return [] as GolgePost[]; }
      const rows = (data as GolgePost[]) ?? [];
      if (rows.length < PAGE_SIZE) setHasMore(false);
      return rows;
    },
    [filter]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setHasMore(true);
      setError(null);
      const rows = await fetchPage(0);
      setPosts(rows);
      setPage(0);
      setLoading(false);
    })();
  }, [fetchPage]);

  useEffect(() => {
    if (user) getBlockedIds(user.id).then(setBlockedIds);
    else setBlockedIds(new Set());
  }, [user]);

  const visible = posts.filter((p) => !blockedIds.has(p.user_id));
  const displayPosts = filter === "trend" ? sortByTrend(visible) : visible;

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    const next = page + 1;
    const rows = await fetchPage(next);
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      return [...prev, ...rows.filter((r) => !seen.has(r.id))];
    });
    setPage(next);
    setLoadingMore(false);
  }, [loadingMore, hasMore, loading, page, fetchPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <Container>
      <div className="py-4">

        {/* ── HEADER ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-extrabold text-white">Gölge</h1>
            <p className="text-xs text-slate-500">Anonim kareler, gizli hikayeler.</p>
          </div>
          <LinkButton href="/golge/new" className="!px-3.5 !py-1.5 text-xs">
            <PlusCircleIcon className="h-3.5 w-3.5" />
            Paylaş
          </LinkButton>
        </motion.div>

        <div className="mb-4">
          <FilterTabs value={filter} onChange={setFilter} />
        </div>

        {loading ? (
          <GolgeSkeletonGrid />
        ) : error ? (
          <div className="glass-card p-6 text-center text-sm text-red-300">{error}</div>
        ) : displayPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card flex flex-col items-center gap-4 py-12 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-3xl shadow-glow-sm"
            >
              🌑
            </motion.div>
            <div>
              <p className="font-semibold text-white">Henüz hiç Gölge yok</p>
              <p className="mt-1 text-xs text-slate-400">İlk kareyi sen paylaş!</p>
            </div>
            <LinkButton href="/golge/new">
              <PlusCircleIcon className="h-4 w-4" />
              İlk Gölgeyi paylaş
            </LinkButton>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-3 gap-1 [grid-auto-flow:dense]"
            >
              {displayPosts.map((p, i) => (
                <GolgeExploreTile key={p.id} post={p} large={isLarge(i)} />
              ))}
            </motion.div>
            <div ref={sentinelRef} className="h-10" />
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
              </div>
            )}
            {!hasMore && displayPosts.length > 0 && (
              <p className="py-4 text-center text-xs text-slate-600">Hepsi bu kadar.</p>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
