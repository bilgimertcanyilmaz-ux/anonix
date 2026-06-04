"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { FeedCard } from "@/components/confession/FeedCard";
import { FollowButton } from "@/components/profile/FollowButton";
import { BlockButton } from "@/components/profile/BlockButton";
import { MessageButton } from "@/components/messages/MessageButton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { getGenderFrameClass, getGenderLabel } from "@/lib/gender";
import { getFollowCounts, type FollowCounts } from "@/lib/follows";
import { fetchLikedConfessionIds } from "@/lib/home";
import { nonExpiredFilter } from "@/lib/feeds";
import { initialsOf } from "@/lib/profile";
import { rankIcon } from "@/lib/ranks";
import { badgeIcon } from "@/lib/badges";
import { recordProfileView } from "@/lib/profileViews";
import { getSubscriptionTier } from "@/lib/subscription";
import { getPremiumTheme } from "@/lib/themes";
import { FramedAvatar } from "@/components/profile/FramedAvatar";
import { CrownIcon, MaskIcon } from "@/components/ui/icons";
import type { Profile, ConfessionRecord, UserBadge } from "@/types";

const HEX = "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)";

/* ── Bilgi pili (cinsiyet/rütbe/puan/katılım) ───────────────── */
function InfoPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 backdrop-blur-sm">
      <span className="text-base">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight text-white">{value}</p>
        <p className="truncate text-[10px] text-slate-400">{label}</p>
      </div>
    </div>
  );
}

/* ── Sıralama/takipçi/takip sütunu ──────────────────────────── */
function StatCol({ top, value, bottom }: { top: string; value: string; bottom: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-2 py-1 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300/80">{top}</p>
      <p className="my-0.5 text-2xl font-extrabold text-white">{value}</p>
      <p className="text-[10px] text-slate-400">{bottom}</p>
    </div>
  );
}

/* ── Hexagon rozet ──────────────────────────────────────────── */
function HexBadge({ icon, name, label }: { icon: string; name: string; label: string }) {
  return (
    <div className="flex w-[19%] shrink-0 flex-col items-center gap-1.5">
      <div className="relative h-16 w-16">
        <span
          className="absolute inset-0"
          style={{
            clipPath: HEX,
            background: "linear-gradient(135deg, rgba(252,211,77,0.5), rgba(168,85,247,0.45))",
            boxShadow: "0 0 18px -4px rgba(252,211,77,0.5)",
          }}
        />
        <span
          className="absolute inset-[2px]"
          style={{
            clipPath: HEX,
            background: "linear-gradient(135deg, rgba(36,24,66,0.96), rgba(20,14,40,0.96))",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          {icon}
        </span>
      </div>
      <span className="max-w-[68px] truncate text-center text-[10px] font-bold leading-tight text-white">{name}</span>
      <span className="text-[8px] font-semibold uppercase tracking-wide text-amber-300/90">{label}</span>
    </div>
  );
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params.username);
  const { user } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [counts, setCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [rankPos, setRankPos] = useState<number | null>(null);
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

    const [fc, { data: bData }, { count: ahead }] = await Promise.all([
      getFollowCounts(p.id),
      supabase.from("user_badges").select("*, badges(*)").eq("user_id", p.id).order("earned_at", { ascending: false }).limit(8),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gt("points", p.points),
    ]);
    setCounts(fc);
    setBadges((bData as UserBadge[]) ?? []);
    setRankPos((ahead ?? 0) + 1);

    // Anonim kullanıcının içerikleri/kimliği ifşa edilmez.
    if (!p.is_anonymous) {
      const { data: confs } = await supabase
        .from("confessions")
        .select("*, profiles(username, gender, is_anonymous, avatar_url, premium_theme)")
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

  useEffect(() => {
    if (profile && user && profile.id !== user.id) {
      void recordProfileView(profile.id);
    }
  }, [profile, user]);

  if (loading) {
    return (
      <Container>
        <div className="space-y-4 py-4">
          <div className="card h-72 animate-pulse" />
          <div className="card h-36 animate-pulse" />
        </div>
      </Container>
    );
  }

  if (notFound || !profile) {
    return (
      <Container>
        <div className="card my-8 p-8 text-center text-sm text-slate-400">Böyle bir kullanıcı bulunamadı.</div>
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
          <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {getGenderLabel(profile.gender)}
          </span>
          <p className="max-w-xs text-xs text-slate-400">
            Bu kullanıcı profilini gizli (anonim) tutuyor. Paylaşımları profilde gösterilmez.
          </p>
        </div>
      </Container>
    );
  }

  const tier = getSubscriptionTier(profile);
  const verified = tier === "ultra_plus" || profile.role === "admin";
  const joinDate = new Date(profile.created_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const genderLabel = getGenderLabel(profile.gender);
  const genderIcon = genderLabel === "Kadın" ? "♀" : genderLabel === "Erkek" ? "♂" : "⚧";
  const avatarInner = profile.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-ink-900 text-2xl font-extrabold text-white">
      {initialsOf(profile.username)}
    </div>
  );

  return (
    <Container>
      <div className="space-y-5 py-4">
        {/* ═══════════ PREMIUM HERO ═══════════ */}
        <div
          className="anonix-dark-card relative overflow-hidden rounded-3xl border border-brand-500/30 p-4 sm:p-5"
          style={{
            background: "linear-gradient(160deg, rgba(45,27,90,0.65) 0%, rgba(20,14,40,0.85) 60%, rgba(12,8,28,0.92) 100%)",
            boxShadow: "0 0 60px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Emblem (premium çerçeve ya da altın taç) */}
            <div className="shrink-0">
              <FramedAvatar themeId={getPremiumTheme(profile.premium_theme) ? profile.premium_theme : "gold"} size={96}>
                {avatarInner}
              </FramedAvatar>
            </div>

            {/* Kimlik */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-1.5">
                <h1 className="truncate text-lg font-extrabold text-white sm:text-xl">@{profile.username}</h1>
                {verified && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-black text-ink-900 shadow-glow">
                    ✓
                  </span>
                )}
              </div>

              {/* Tier + rütbe rozetleri (alt alta, referanstaki gibi) */}
              <div className="mt-2 flex flex-col gap-1.5">
                {(tier === "ultra_plus" || tier === "plus") && (
                  <span
                    className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-400/20 to-amber-600/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-amber-200"
                    style={{ boxShadow: "0 0 16px -4px rgba(252,211,77,0.6)" }}
                  >
                    <CrownIcon className="h-3.5 w-3.5" />
                    {tier === "ultra_plus" ? "Ultra Premium" : "Plus Üye"}
                  </span>
                )}
                <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-brand-400/50 bg-brand-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-100">
                  {rankIcon(profile.rank)} {profile.rank}
                </span>
              </div>
            </div>

            {/* Aksiyonlar */}
            <div className="flex shrink-0 flex-col items-stretch gap-2">
              <FollowButton targetUserId={profile.id} />
              <MessageButton authorId={profile.id} />
              <BlockButton targetUserId={profile.id} size="sm" />
            </div>
          </div>

          {/* Bilgi pilleri */}
          <div className="mt-4 flex gap-2">
            <InfoPill icon={genderIcon} label="Cinsiyet" value={genderLabel} />
            <InfoPill icon={rankIcon(profile.rank)} label="Rütbe" value={profile.rank} />
            <InfoPill icon="⭐" label="Puan" value={profile.points.toLocaleString("tr-TR")} />
            <InfoPill icon="📅" label="Katılım" value={joinDate} />
          </div>
        </div>

        {/* ═══════════ SIRALAMA / TAKİPÇİ / TAKİP ═══════════ */}
        <div
          className="anonix-dark-card relative overflow-hidden rounded-2xl border border-amber-300/30 p-2"
          style={{
            background: "linear-gradient(135deg, rgba(45,27,90,0.5), rgba(20,14,40,0.7))",
            boxShadow: "0 0 30px -12px rgba(252,211,77,0.4)",
          }}
        >
          <div className="flex items-stretch divide-x divide-white/10">
            <StatCol top="Sıralama" value={`#${rankPos ?? "—"}`} bottom="En Aktif" />
            <StatCol top="Toplam Takipçi" value={counts.followers.toLocaleString("tr-TR")} bottom="Kişi" />
            <StatCol top="Toplam Takip" value={counts.following.toLocaleString("tr-TR")} bottom="Kişi" />
          </div>
        </div>

        {/* ═══════════ ROZETLER ═══════════ */}
        {badges.length > 0 && (
          <div
            className="anonix-dark-card rounded-2xl border border-white/10 p-4"
            style={{ background: "linear-gradient(135deg, rgba(30,20,55,0.5), rgba(18,12,36,0.6))" }}
          >
            <div className="flex flex-wrap justify-around gap-y-4">
              {badges.slice(0, 5).map((ub) => (
                <HexBadge
                  key={ub.id}
                  icon={ub.badges ? badgeIcon(ub.badges) : "🏅"}
                  name={ub.badges?.name ?? "Rozet"}
                  label={ub.badges?.badge_type === "special" ? "Efsanevi" : ub.badges?.badge_type === "rank" ? "Epik" : "Üye"}
                />
              ))}
            </div>
          </div>
        )}

        {/* ═══════════ PAYLAŞIMLARI ═══════════ */}
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
