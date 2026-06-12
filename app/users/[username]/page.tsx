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
import { getPremiumTheme, isThemeUnlocked } from "@/lib/themes";
import { getNextRank, getRankProgress } from "@/lib/ranks";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/ui/EmptyState";
import { FramedAvatar } from "@/components/profile/FramedAvatar";
import { CrownIcon } from "@/components/ui/icons";
import { AnonymousAvatar } from "@/components/AnonymousAvatar";
import { PROFILE_SELECT } from "@/lib/profileColumns";
import type { Profile, ConfessionRecord, UserBadge } from "@/types";

const HEX = "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)";

/* ── Bilgi pili (cinsiyet/rütbe/puan/katılım) ───────────────── */
function InfoPill({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 backdrop-blur-sm">
      <span className="shrink-0 text-base">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-tight text-white">{value}</p>
        <p className="text-[10px] text-slate-400">{label}</p>
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
      <span className="line-clamp-2 max-w-full text-center text-[10px] font-bold leading-tight text-white">{name}</span>
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
      .select(PROFILE_SELECT)
      .eq("username", username)
      .maybeSingle();

    if (!prof) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const p = prof as unknown as Profile;
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
            <div className="h-full w-full overflow-hidden rounded-full bg-ink-900">
              <AnonymousAvatar />
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
  // Çerçeve YALNIZCA kullanıcı gerçekten hak etmişse gösterilir (rütbe puanı
  // ya da Ultra Plus). Eski koddaki "tema yoksa gold göster" hatası kaldırıldı.
  const theme = getPremiumTheme(profile.premium_theme);
  const ultraAllowed = tier === "ultra_plus" || profile.role === "admin";
  const themeValid = !!theme && isThemeUnlocked(theme, profile.points, ultraAllowed);
  const nextRank = getNextRank(profile.points);
  const rankPct = getRankProgress(profile.points);
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
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 24 }}
          className="anonix-dark-card relative overflow-hidden rounded-3xl border border-brand-500/30 p-4 sm:p-5"
          style={{
            background: "linear-gradient(160deg, rgba(40,24,80,0.97) 0%, rgba(20,14,40,0.98) 60%, rgba(12,8,28,0.99) 100%)",
            boxShadow: "0 0 60px -16px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Aurora ışıkları */}
          <motion.div
            aria-hidden
            animate={{ x: [0, 16, 0], opacity: [0.35, 0.6, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-56 rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(236,72,153,0.28), transparent 70%)" }}
          />
          <motion.div
            aria-hidden
            animate={{ x: [0, -12, 0], opacity: [0.25, 0.5, 0.25] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 3 }}
            className="pointer-events-none absolute -bottom-14 left-1/4 h-36 w-64 rounded-full blur-3xl"
            style={{ background: "radial-gradient(ellipse, rgba(96,165,250,0.2), transparent 70%)" }}
          />
          {/* Sağ-üst köşe: tier + rütbe (küçük) */}
          <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
            {(tier === "ultra_plus" || tier === "plus") && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/60 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200">
                <CrownIcon className="h-2.5 w-2.5" />
                {tier === "ultra_plus" ? "Ultra" : "Plus"}
              </span>
            )}
            <span className="inline-flex max-w-[96px] items-center gap-1 rounded-full border border-brand-400/50 bg-brand-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-100">
              <span>{rankIcon(profile.rank)}</span>
              <span className="truncate">{profile.rank}</span>
            </span>
          </div>

          {/* Avatar + kullanıcı adı aynı hizada (isim tam genişlik) */}
          <div className="relative flex items-center gap-3.5 pr-1 sm:gap-4">
            <div className="shrink-0">
              {themeValid ? (
                <FramedAvatar themeId={profile.premium_theme} size={104}>
                  {avatarInner}
                </FramedAvatar>
              ) : (
                /* Çerçeve hak edilmemişse cinsiyet halkalı sade avatar */
                <div
                  className={`flex h-[88px] w-[88px] items-center justify-center rounded-full p-[3px] ${getGenderFrameClass(profile.gender)}`}
                >
                  <div className="h-full w-full overflow-hidden rounded-full bg-ink-900">
                    {avatarInner}
                  </div>
                </div>
              )}
            </div>
            <h1 className="flex min-w-0 items-center gap-1.5 text-lg font-extrabold text-white sm:text-xl">
              <span className="truncate">@{profile.username}</span>
              {verified && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[11px] font-black text-ink-900 shadow-glow">
                  ✓
                </span>
              )}
            </h1>
          </div>

          {/* Aksiyonlar — tam genişlik satır */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <FollowButton targetUserId={profile.id} />
            <MessageButton authorId={profile.id} />
            <BlockButton targetUserId={profile.id} size="sm" />
          </div>

          {/* Bilgi pilleri — 2×2 (mobil), tek satır (geniş) */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <InfoPill icon={genderIcon} label="Cinsiyet" value={genderLabel} />
            <InfoPill icon={rankIcon(profile.rank)} label="Rütbe" value={profile.rank} />
            <InfoPill icon="⭐" label="Puan" value={profile.points.toLocaleString("tr-TR")} />
            <InfoPill icon="📅" label="Katılım" value={joinDate} />
          </div>

          {/* Rütbe ilerlemesi */}
          {nextRank && (
            <div className="relative mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="font-semibold text-white/50">
                  Sonraki rütbe: {rankIcon(nextRank.rank)} {nextRank.rank}
                </span>
                <span className="font-bold text-brand-200">%{rankPct}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rankPct}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #a855f7, #ec4899)",
                    boxShadow: "0 0 10px rgba(236,72,153,0.5)",
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* ═══════════ SIRALAMA / TAKİPÇİ / TAKİP ═══════════ */}
        <div
          className="anonix-dark-card relative overflow-hidden rounded-2xl border border-amber-300/30 p-2"
          style={{
            background: "linear-gradient(135deg, rgba(40,24,80,0.96), rgba(18,12,36,0.98))",
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
            style={{ background: "linear-gradient(135deg, rgba(34,22,62,0.96), rgba(18,12,36,0.98))" }}
          >
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400/15 text-xs">🏅</span>
              Rozetleri
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-300">
                {badges.length}
              </span>
            </h2>
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
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm">📝</span>
            Paylaşımları
            {confessions.length > 0 && (
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-extrabold text-slate-400">
                {confessions.length}
              </span>
            )}
          </h2>
          {confessions.length === 0 ? (
            <EmptyState
              icon="🤫"
              title="Henüz açık paylaşımı yok"
              description="Bu kullanıcının herkese açık itirafı bulunmuyor."
            />
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
