"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { UserIdentity } from "@/components/UserIdentity";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Gender } from "@/types";

interface ListProfile {
  id: string;
  username: string;
  gender: Gender;
  is_anonymous: boolean;
}

type Mode = "followers" | "following";

/**
 * Kullanıcının takipçi / takip edilen listesi.
 * Anonim kullanıcılar "Anonim Kullanıcı" olarak görünür (kimlik gizli);
 * cinsiyet her zaman gösterilir. Açık profiller kullanıcı adıyla görünür.
 */
export function FollowList({ mode }: { mode: Mode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [people, setPeople] = useState<ListProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // followers: beni takip edenler (following_id = ben) → follower_id'leri al
    // following: benim takip ettiklerim (follower_id = ben) → following_id'leri al
    const meCol = mode === "followers" ? "following_id" : "follower_id";
    const otherCol = mode === "followers" ? "follower_id" : "following_id";

    const { data: rows } = await supabase
      .from("follows")
      .select(otherCol)
      .eq(meCol, user.id);

    const ids = (rows ?? []).map((r) => (r as Record<string, string>)[otherCol]);
    if (ids.length === 0) {
      setPeople([]);
      setLoading(false);
      return;
    }

    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, gender, is_anonymous")
      .in("id", ids);
    setPeople((profs as ListProfile[]) ?? []);
    setLoading(false);
  }, [user, mode]);

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

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition-colors ${
      active ? "bg-brand-gradient text-white shadow-glow" : "bg-white/5 text-slate-300 hover:bg-white/10"
    }`;

  return (
    <Container>
      <div className="py-4">
        <h1 className="mb-4 text-2xl font-extrabold text-white">
          {mode === "followers" ? "Takipçiler" : "Takip Edilenler"}
        </h1>

        <div className="mb-5 flex gap-2">
          <Link href="/profile/followers" className={tabClass(mode === "followers")}>
            Takipçiler
          </Link>
          <Link href="/profile/following" className={tabClass(mode === "following")}>
            Takip Edilenler
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-16 animate-pulse" />
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            {mode === "followers"
              ? "Henüz takipçin yok."
              : "Henüz kimseyi takip etmiyorsun."}
          </div>
        ) : (
          <div className="space-y-3">
            {people.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-3 p-3">
                <UserIdentity
                  username={p.username}
                  gender={p.gender}
                  isAnonymous={p.is_anonymous}
                  showGender
                  showUsername
                  profileHref={!p.is_anonymous ? `/users/${p.username}` : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
