"use client";

import { useEffect, useState, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";
import { GolgeReels } from "@/components/golge/GolgeReels";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBlockedIds } from "@/lib/blocks";
import { fetchLikedGolgeIds } from "@/lib/home";
import { sortByTrend, feedFilters, type FeedFilter } from "@/lib/trending";
import { PlusCircleIcon } from "@/components/ui/icons";
import type { GolgePost } from "@/types";

const PAGE_SIZE = 12;
/** Navbar (h-16) + çentik güvenli alanı — üst çubuk ve reels bu hizadan başlar. */
const TOP_OFFSET = "calc(4rem + env(safe-area-inset-top))";

export default function GolgeFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<GolgePost[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<FeedFilter>("new");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (error) {
        setError("Gölge akışı yüklenemedi.");
        return [] as GolgePost[];
      }
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
    if (user) {
      getBlockedIds(user.id).then(setBlockedIds);
      fetchLikedGolgeIds(user.id).then(setLikedIds);
    } else {
      setBlockedIds(new Set());
      setLikedIds(new Set());
    }
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

  // ── Yükleniyor ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-center bg-black" style={{ top: TOP_OFFSET }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
      </div>
    );
  }

  // ── Hata ────────────────────────────────────────────────────
  if (error) {
    return (
      <Container>
        <div className="glass-card my-8 flex flex-col items-center gap-3 p-6 text-center text-sm text-red-300">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-ghost px-5 py-2 text-xs"
          >
            ↻ Tekrar dene
          </button>
        </div>
      </Container>
    );
  }

  // ── Boş ─────────────────────────────────────────────────────
  if (displayPosts.length === 0) {
    return (
      <Container>
        <div className="glass-card my-8 flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-3xl shadow-glow-sm">
            🌑
          </div>
          <div>
            <p className="font-semibold text-white">Henüz hiç Gölge yok</p>
            <p className="mt-1 text-xs text-slate-400">İlk kareyi sen paylaş!</p>
          </div>
          <LinkButton href="/golge/new">
            <PlusCircleIcon className="h-4 w-4" />
            İlk Gölgeyi paylaş
          </LinkButton>
        </div>
      </Container>
    );
  }

  // ── Reels akışı ─────────────────────────────────────────────
  return (
    <>
      {/* Üst çubuk: filtreler + paylaş (reels'in üstünde) */}
      <div
        className="fixed inset-x-0 z-[35] flex items-center gap-2 px-3 py-2"
        style={{ top: TOP_OFFSET }}
      >
        <div className="flex flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {feedFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md transition-colors ${
                filter === f.value
                  ? "border-brand-400/60 bg-brand-500/30 text-white"
                  : "border-white/15 bg-black/40 text-slate-300 hover:bg-black/55"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <LinkButton href="/golge/new" className="shrink-0 !px-3 !py-1.5 text-xs">
          <PlusCircleIcon className="h-3.5 w-3.5" />
          Paylaş
        </LinkButton>
      </div>

      <GolgeReels posts={displayPosts} likedIds={likedIds} loadMore={loadMore} hasMore={hasMore} />
    </>
  );
}
