"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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

/** Her N hücrede bir büyük (2x2) kart — keşfet estetiği. */
function isLarge(index: number): boolean {
  return index % 7 === 0;
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
        .select("*, profiles(username, gender, is_anonymous, avatar_url)")
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
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <Container>
      <div className="py-4">
        {/* Üst bar */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Gölge</h1>
            <p className="text-xs text-slate-400">Anonim kareler, gizli hikayeler.</p>
          </div>
          <LinkButton href="/golge/new" className="!px-4 !py-2 text-xs">
            <PlusCircleIcon className="h-4 w-4" />
            Paylaş
          </LinkButton>
        </div>

        {/* Kompakt filtreler */}
        <FilterTabs value={filter} onChange={setFilter} />

        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-center text-sm text-red-200">{error}</div>
        ) : displayPosts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-slate-400">Henüz hiç Gölge yok. İlk kareyi sen paylaş!</p>
            <div className="mt-4">
              <LinkButton href="/golge/new">İlk Gölgeyi paylaş</LinkButton>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-1 [grid-auto-flow:dense]">
              {displayPosts.map((p, i) => (
                <GolgeExploreTile key={p.id} post={p} large={isLarge(i)} />
              ))}
            </div>
            <div ref={sentinelRef} className="h-10" />
            {loadingMore && (
              <p className="py-4 text-center text-xs text-slate-500">Yükleniyor...</p>
            )}
            {!hasMore && (
              <p className="py-4 text-center text-xs text-slate-600">Hepsi bu kadar.</p>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
