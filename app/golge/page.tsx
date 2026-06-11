"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";
import { GolgeReels } from "@/components/golge/GolgeReels";
import { GolgeExploreTile } from "@/components/golge/GolgeExploreTile";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBlockedIds } from "@/lib/blocks";
import { fetchLikedGolgeIds } from "@/lib/home";
import { sortByTrend, feedFilters, type FeedFilter } from "@/lib/trending";
import { PlusCircleIcon } from "@/components/ui/icons";
import type { GolgePost } from "@/types";

const PAGE_SIZE = 18;

/** Mozaik: her 3'lü satır bloğunda bir kare büyür (Instagram keşfet hissi). */
function isLargeTile(i: number): boolean {
  return i % 12 === 0 || i % 12 === 7;
}

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
  /** Görüntüleyici: null=grid, sayı=o indexten başlayan reels. */
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
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
      setViewerIndex(null);
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

  // Grid sonsuz kaydırma
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || viewerIndex !== null) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [loadMore, viewerIndex, loading]);

  // Görüntüleyici açıkken arka plan kaydırmasını kilitle
  useEffect(() => {
    if (viewerIndex !== null) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [viewerIndex]);

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

  return (
    <>
      <Container>
        <div className="py-4">
          {/* ── BAŞLIK ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-1 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
                <motion.span
                  aria-hidden
                  animate={{ rotate: [-8, 8, -8] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="text-2xl drop-shadow-[0_2px_10px_rgba(129,140,248,0.5)]"
                >
                  🌙
                </motion.span>
                <span className="hero-title"
                  style={{
                    background:
                      "linear-gradient(135deg, #fff 0%, #c7d2fe 40%, #818cf8 75%, #a855f7 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 16px rgba(129,140,248,0.35))",
                  }}
                >
                  Gölge
                </span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Bir kare seç, sonra kaydırarak gez.
              </p>
            </div>
            <LinkButton href="/golge/new" className="shrink-0 !px-4 !py-2 text-xs">
              <PlusCircleIcon className="h-4 w-4" />
              Paylaş
            </LinkButton>
          </motion.div>

          {/* ── FİLTRELER (segment) ────────────────────────────── */}
          <div className="mb-4 mt-3 inline-flex max-w-full overflow-x-auto rounded-full border border-white/10 bg-white/[0.04] p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {feedFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`relative shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                  filter === f.value ? "text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter === f.value && (
                  <motion.span
                    layoutId="golge-filter-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-brand-500 shadow-glow-sm"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>

          {/* ── GRID ───────────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-3 gap-1.5 [grid-auto-flow:dense]">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square animate-pulse rounded-lg bg-white/5 ${
                    isLargeTile(i) ? "col-span-2 row-span-2" : ""
                  }`}
                />
              ))}
            </div>
          ) : displayPosts.length === 0 ? (
            <div className="glass-card my-6 flex flex-col items-center gap-4 py-12 text-center">
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
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-3 gap-1.5 [grid-auto-flow:dense]"
              >
                {displayPosts.map((p, i) => (
                  <GolgeExploreTile
                    key={p.id}
                    post={p}
                    large={isLargeTile(i)}
                    onOpen={() => setViewerIndex(i)}
                  />
                ))}
              </motion.div>

              {/* Sonsuz yükleme */}
              {hasMore && <div ref={sentinelRef} className="h-px w-full" />}
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
                </div>
              )}
            </>
          )}
        </div>
      </Container>

      {/* ── GÖRÜNTÜLEYİCİ (seçilen kareden başlayan reels) ────── */}
      {viewerIndex !== null && (
        <GolgeReels
          posts={displayPosts}
          likedIds={likedIds}
          loadMore={loadMore}
          hasMore={hasMore}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
