"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { FeedCard } from "@/components/confession/FeedCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { personalize, inferPreferredMoods } from "@/lib/engagement";
import { nonExpiredFilter } from "@/lib/feeds";
import { SparkIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ConfessionRecord } from "@/types";

export default function ForYouPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ConfessionRecord[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Kullanıcının beğendiği itirafların mood'larından ilgi alanı çıkar
    const { data: likes } = await supabase
      .from("confession_likes")
      .select("confession_id, confessions(mood_tag)")
      .eq("user_id", user.id)
      .limit(80);
    const likedSet = new Set((likes ?? []).map((l) => l.confession_id as string));
    setLikedIds(likedSet);
    const moods = inferPreferredMoods(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (likes ?? []).map((l) => (l.confessions as any)?.mood_tag ?? null)
    );

    // Son içerikleri çek, ilgi alanına göre kişiselleştir
    const { data } = await supabase
      .from("confessions")
      .select("*, profiles(username, gender, is_anonymous, avatar_url, premium_theme)")
      .or(nonExpiredFilter())
      .order("created_at", { ascending: false })
      .limit(60);

    const ranked = personalize((data as ConfessionRecord[]) ?? [], moods).slice(0, 30);
    setItems(ranked);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (authLoading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-4">
        <div className="mb-1 flex items-center gap-2">
          <SparkIcon className="h-6 w-6 text-brand-300" />
          <h1 className="text-2xl font-extrabold text-white">Sana Özel</h1>
        </div>
        <p className="mb-5 text-sm text-slate-400">İlgi alanlarına göre seçilen itiraflar.</p>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-36 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="✨"
            title="Henüz öneri yok"
            description="Birkaç itiraf beğen, sana özel akışın şekillensin."
            actionLabel="İtirafları keşfet"
            actionHref="/confessions"
          />
        ) : (
          <div className="space-y-4">
            {items.map((c) => (
              <FeedCard key={c.id} confession={c} liked={likedIds.has(c.id)} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
