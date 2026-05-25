"use client";

import { useEffect, useState, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";
import { FeedCard } from "@/components/confession/FeedCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { PlusCircleIcon } from "@/components/ui/icons";
import type { ConfessionRecord } from "@/types";

export default function ConfessionsPage() {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("confessions")
      .select("*, profiles(username, gender, is_anonymous)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setError("İtiraflar yüklenemedi. Lütfen tekrar dene.");
      setLoading(false);
      return;
    }
    setConfessions((data as ConfessionRecord[]) ?? []);

    // Kullanıcının beğenilerini al (beğeni durumunu göstermek için)
    if (user) {
      const { data: likes } = await supabase
        .from("confession_likes")
        .select("confession_id")
        .eq("user_id", user.id);
      setLikedIds(new Set((likes ?? []).map((l) => l.confession_id as string)));
    } else {
      setLikedIds(new Set());
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Container>
      <div className="py-4">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white">Keşfet</h1>
          <LinkButton href="/confessions/new" className="!px-4 !py-2 text-xs">
            <PlusCircleIcon className="h-4 w-4" />
            İtiraf Yaz
          </LinkButton>
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
            <p className="text-sm text-slate-400">
              Henüz hiç itiraf yok. İlk itirafı sen paylaş!
            </p>
            <div className="mt-4">
              <LinkButton href="/confessions/new">İlk itirafı yaz</LinkButton>
            </div>
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
