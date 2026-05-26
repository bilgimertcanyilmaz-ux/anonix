"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { FeedCard } from "@/components/confession/FeedCard";
import { FollowButton } from "@/components/profile/FollowButton";
import { BlockButton } from "@/components/profile/BlockButton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { getGenderFrameClass, getGenderLabel, getGenderBadgeClass } from "@/lib/gender";
import { getFollowCounts, type FollowCounts } from "@/lib/follows";
import { fetchLikedConfessionIds } from "@/lib/home";
import { nonExpiredFilter } from "@/lib/feeds";
import { initialsOf } from "@/lib/profile";
import { rankIcon } from "@/lib/ranks";
import { CrownIcon, MaskIcon } from "@/components/ui/icons";
import type { Profile, ConfessionRecord } from "@/types";

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params.username);
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (!prof) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const p = prof as Profile;
    setProfile(p);
    setCounts(await getFollowCounts(p.id));

    // Anonim kullanıcının içerikleri/kimliği ifşa edilmez.
    if (!p.is_anonymous) {
      const { data: confs } = await supabase
        .from("confessions")
        .select("*, profiles(username, gender, is_anonymous, avatar_url)")
        .eq("user_id", p.id)
        .eq("is_anonymous", false)
        .or(nonExpiredFilter())
        .order("created_at", { ascending: false })
        .limit(20);
      setConfessions((confs as ConfessionRecord[]) ?? []);
      if (user) setLikedIds(await fetchLikedConfessionIds(user.id));
    }

    setLoading(false);
  }, [username, user]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Container>
        <div className="space-y-4 py-4">
          <div className="card h-40 animate-pulse" />
          <div className="card h-36 animate-pulse" />
        </div>
      </Container>
    );
  }

  if (notFound || !profile) {
    return (
      <Container>
        <div className="card my-8 p-8 text-center text-sm text-slate-400">
          Böyle bir kullanıcı bulunamadı.
        </div>
      </Container>
    );
  }

  // Anonim profil: kimlik gizli, içerik gösterilmez (yalnızca cinsiyet görünür).
  if (profile.is_anonymous) {
    return (
      <Container>
        <div className="card my-8 flex flex-col items-center gap-3 p-8 text-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full p-[3px] ${getGenderFrameClass(profile.gender)}`}>
            <div className="flex h-full w-full items-center justify-center rounded-full bg-ink-900">
              <MaskIcon className="h-7 w-7 text-slate-300" />
            </div>
          </div>
          <p className="text-sm font-semibold text-white">Anonim Kullanıcı</p>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGenderBadgeClass(profile.gender)}`}>
            {getGenderLabel(profile.gender)}
          </span>
          <p className="max-w-xs text-xs text-slate-400">
            Bu kullanıcı profilini gizli (anonim) tutuyor. Paylaşımları profilde gösterilmez.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-5 py-4">
        {/* Başlık kartı */}
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full p-[3px] ${getGenderFrameClass(profile.gender)} ${profile.is_plus ? "shadow-glow ring-2 ring-amber-300/70" : ""}`}>
              <div className="flex h-full w-full items-center justify-center rounded-full bg-ink-900 text-xl font-bold text-white">
                {initialsOf(profile.username)}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-extrabold text-white">@{profile.username}</h1>
                {profile.is_plus && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2 py-0.5 text-[10px] font-bold text-ink-900 shadow-glow">
                    <CrownIcon className="h-3 w-3" />
                    PLUS
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGenderBadgeClass(profile.gender)}`}>
                  {getGenderLabel(profile.gender)}
                </span>
                <span className="text-xs text-slate-400">
                  {rankIcon(profile.rank)} {profile.rank} · {profile.points.toLocaleString("tr-TR")} puan
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                <span><span className="font-bold text-white">{counts.followers}</span> Takipçi</span>
                <span><span className="font-bold text-white">{counts.following}</span> Takip</span>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <FollowButton targetUserId={profile.id} />
              <BlockButton targetUserId={profile.id} size="sm" />
            </div>
          </div>
        </div>

        {/* Açık itirafları */}
        <div>
          <h2 className="mb-3 text-lg font-bold text-white">Paylaşımları</h2>
          {confessions.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-400">
              Bu kullanıcının herkese açık itirafı yok.
            </div>
          ) : (
            <div className="space-y-4">
              {confessions.map((c) => (
                <FeedCard key={c.id} confession={c} liked={likedIds.has(c.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
