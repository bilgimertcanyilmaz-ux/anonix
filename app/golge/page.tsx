"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";
import { GolgeCard } from "@/components/golge/GolgeCard";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { sortByTrend, type FeedFilter } from "@/lib/trending";
import { PlusCircleIcon } from "@/components/ui/icons";
import type { GolgePost } from "@/types";

const PAGE_SIZE = 12;

export default function GolgeFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<GolgePost[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
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

      let query = supabase.from("golge_posts").select("*, profiles(username, gender, is_anonymous, avatar_url)");
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

  // İlk yükleme / filtre değişimi
  useEffect(() => {
    (async () => {
      setLoading(true);
      setHasMore(true);
      const rows = await fetchPage(0);
      setPosts(rows);
      setPage(0);
      setLoading(false);

      if (user) {
        const { data: likes } = await supabase
          .from("golge_likes")
          .select("golge_post_id")
          .eq("user_id", user.id);
        setLikedIds(new Set((likes ?? []).map((l) => l.golge_post_id as string)));
      }
    })();
  }, [fetchPage, user]);

  // Trend filtresinde yüklenen seti istemci tarafında trend skoruna göre sırala
  const displayPosts = filter === "trend" ? sortByTrend(posts) : posts;

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

  // Sonsuz scroll
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <Container>
      <div className="py-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Gölge</h1>
            <p className="text-xs text-slate-400">Fotoğrafla anlat, gölgede kal.</p>
          </div>
          <LinkButton href="/golge/new" className="!px-4 !py-2 text-xs">
            <PlusCircleIcon className="h-4 w-4" />
            Paylaş
          </LinkButton>
        </div>

        <FilterTabs value={filter} onChange={setFilter} />

        {loading ? (
          <div className="columns-2 gap-3 sm:columns-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="mb-3 h-48 animate-pulse rounded-2xl bg-white/5"
                style={{ height: `${140 + (i % 3) * 60}px` }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-center text-sm text-red-200">{error}</div>
        ) : displayPosts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-slate-400">
              Henüz hiç Gölge yok. İlk fotoğrafı sen paylaş!
            </p>
            <div className="mt-4">
              <LinkButton href="/golge/new">İlk Gölgeyi paylaş</LinkButton>
            </div>
          </div>
        ) : (
          <>
            <div className="columns-2 gap-3 sm:columns-3">
              {displayPosts.map((p) => (
                <GolgeCard key={p.id} post={p} liked={likedIds.has(p.id)} />
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
