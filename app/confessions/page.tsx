"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { FeedCard } from "@/components/confession/FeedCard";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { sortByTrend } from "@/lib/trending";
import {
  extendedFilters,
  type ExtendedFilter,
  sortByHot,
  isFromToday,
  isNightHours,
  nonExpiredFilter,
} from "@/lib/feeds";
import { getExploreFeed } from "@/lib/recommendations";
import { getBlockedIds } from "@/lib/blocks";
import { isBoosted } from "@/lib/boost";
import { CATEGORIES } from "@/lib/categories";
import { AdSlot } from "@/components/premium/AdSlot";
import { PlusCircleIcon, TrophyIcon, SparkIcon } from "@/components/ui/icons";
import type { ConfessionRecord } from "@/types";

const CONF_SELECT = "*, profiles(username, gender, is_anonymous, avatar_url, premium_theme)";

/* ═══════════════════════════════════════════════════════════════
   STARFIELD — CSS-only animated background particles
   ═══════════════════════════════════════════════════════════════ */
function Starfield() {
  // 12 deterministic positions (no hydration mismatch)
  const stars = [
    { l: "8%", t: "12%", s: 2, d: 0 },
    { l: "22%", t: "30%", s: 1, d: 0.8 },
    { l: "44%", t: "8%", s: 3, d: 1.5 },
    { l: "65%", t: "22%", s: 2, d: 0.3 },
    { l: "85%", t: "16%", s: 1, d: 2 },
    { l: "12%", t: "55%", s: 2, d: 1.1 },
    { l: "33%", t: "70%", s: 1, d: 0.5 },
    { l: "58%", t: "60%", s: 3, d: 1.8 },
    { l: "78%", t: "75%", s: 2, d: 0.7 },
    { l: "92%", t: "45%", s: 1, d: 2.2 },
    { l: "5%", t: "85%", s: 1, d: 0.9 },
    { l: "70%", t: "92%", s: 2, d: 1.4 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {stars.map((s, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 3 + s.d, delay: s.d, repeat: Infinity, ease: "easeInOut" }}
          className="absolute rounded-full bg-white"
          style={{
            left: s.l,
            top: s.t,
            width: `${s.s}px`,
            height: `${s.s}px`,
            boxShadow: `0 0 ${s.s * 3}px rgba(255,255,255,0.9), 0 0 ${s.s * 6}px rgba(168,85,247,0.6)`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO HEADER — gigantic title + trophy orb + İtiraf Yaz pill
   ═══════════════════════════════════════════════════════════════ */
function HeroHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      className="relative mb-6 flex items-start justify-between gap-4"
    >
      <div className="relative min-w-0 flex-1">
        {/* Floating sparkles around title */}
        <motion.span
          aria-hidden
          animate={{ y: [0, -4, 0], rotate: [0, 12, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-2 -top-1 text-lg sm:text-xl"
        >
          ✨
        </motion.span>
        <motion.span
          aria-hidden
          animate={{ y: [0, 4, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -left-1 top-6 text-xs sm:text-sm"
        >
          ✦
        </motion.span>
        <h1
          className="hero-title relative text-5xl font-extrabold leading-none tracking-tight sm:text-6xl"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f5d0fe 30%, #c084fc 60%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 24px rgba(168,85,247,0.45))",
          }}
        >
          Keşfet
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-slate-300/90">
          Anonim itiraflar, gerçek hisler{" "}
          <span className="text-base">💜</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 pt-2">
        {/* Gold trophy orb */}
        <Link
          href="/leaderboard"
          aria-label="Liderlik tablosu"
          className="group relative flex h-11 w-11 items-center justify-center"
        >
          {/* Outer animated ring */}
          <motion.span
            aria-hidden
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full opacity-80"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, rgba(252,211,77,0.9) 25%, transparent 50%, rgba(168,85,247,0.7) 75%, transparent 100%)",
              padding: "1.5px",
              WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
            }}
          />
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-glow-gold transition-transform group-hover:scale-110"
            style={{
              background: "radial-gradient(circle at 30% 30%, #fde68a 0%, #f59e0b 60%, #b45309 100%)",
            }}
          >
            <TrophyIcon className="h-4 w-4 text-ink-900 drop-shadow" />
          </span>
        </Link>

        {/* İtiraf Yaz — neon capsule */}
        <motion.div whileTap={{ scale: 0.96 }}>
          <Link
            href="/confessions/new"
            className="itiraf-yaz-btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold text-white transition-all"
            style={{
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #7c3aed 100%)",
              boxShadow: "0 0 24px -4px rgba(168,85,247,0.7), 0 0 40px -8px rgba(236,72,153,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            {/* Shine sweep */}
            <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <motion.span
                animate={{ x: ["-120%", "220%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
                className="absolute inset-y-0 w-1/3"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
              />
            </span>
            <PlusCircleIcon className="relative h-4 w-4" />
            <span className="relative">İtiraf Yaz</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO CARD — Gece İtirafları cinematic banner
   ═══════════════════════════════════════════════════════════════ */
function NightHeroCard({ totalCount }: { totalCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
      className="anonix-dark-card relative mb-5 overflow-hidden rounded-3xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(76,29,149,0.55) 0%, rgba(30,27,75,0.7) 50%, rgba(15,23,42,0.85) 100%)",
        border: "1px solid rgba(168,85,247,0.35)",
        boxShadow: "0 0 60px -16px rgba(124,58,237,0.5), 0 30px 60px -25px rgba(0,0,0,0.7)",
      }}
    >
      {/* Starfield particles */}
      <Starfield />

      {/* City silhouette + moon (CSS-only) */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%]" aria-hidden>
        {/* Sky gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 75% 35%, rgba(244,114,182,0.25) 0%, transparent 45%), radial-gradient(ellipse at 50% 70%, rgba(124,58,237,0.4) 0%, transparent 60%)",
          }}
        />
        {/* Moon */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-8 top-6 h-20 w-20 rounded-full sm:right-12 sm:top-8 sm:h-24 sm:w-24"
          style={{
            background: "radial-gradient(circle at 35% 35%, #fef3c7 0%, #fcd34d 40%, #f59e0b 70%, transparent 100%)",
            boxShadow: "0 0 40px 8px rgba(252,211,77,0.4), 0 0 80px 16px rgba(168,85,247,0.3)",
          }}
        >
          {/* Crescent shadow */}
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle at 70% 50%, transparent 38%, rgba(15,10,30,0.85) 42%)",
            }}
          />
        </motion.div>
        {/* City silhouette */}
        <svg
          viewBox="0 0 400 120"
          className="absolute bottom-0 left-0 h-24 w-full sm:h-32"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="city" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f0a1f" />
            </linearGradient>
          </defs>
          <path
            d="M0,120 L0,80 L20,80 L20,60 L35,60 L35,75 L50,75 L50,40 L65,40 L65,55 L80,55 L80,30 L95,30 L95,50 L110,50 L110,65 L130,65 L130,45 L150,45 L150,55 L170,55 L170,35 L185,35 L185,50 L205,50 L205,25 L220,25 L220,40 L240,40 L240,60 L260,60 L260,45 L280,45 L280,55 L300,55 L300,30 L320,30 L320,50 L340,50 L340,65 L360,65 L360,55 L380,55 L380,70 L400,70 L400,120 Z"
            fill="url(#city)"
            opacity="0.85"
          />
          {/* Window lights */}
          {[
            [25, 90], [40, 70], [55, 65], [70, 50], [85, 45], [95, 55], [115, 70],
            [135, 55], [155, 60], [175, 45], [190, 60], [210, 38], [225, 55],
            [245, 70], [265, 55], [285, 65], [305, 45], [325, 60], [345, 75], [365, 65],
          ].map(([x, y], i) => (
            <motion.rect
              key={i}
              x={x}
              y={y}
              width="1.5"
              height="1.5"
              fill="#fde68a"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2 + (i % 5), repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </svg>
        {/* Subtle leaves silhouette right edge */}
        <div
          className="absolute -right-2 bottom-0 h-full w-16 opacity-40"
          style={{
            background: "radial-gradient(ellipse at right bottom, rgba(15,10,30,0.9) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Content (left side) */}
      <div className="relative z-10 max-w-[58%] p-5 sm:p-6">
        {/* Trend chip */}
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: "linear-gradient(135deg, rgba(249,115,22,0.25), rgba(236,72,153,0.25))",
            border: "1px solid rgba(249,115,22,0.5)",
            color: "#fdba74",
            boxShadow: "0 0 16px -4px rgba(249,115,22,0.5)",
          }}
        >
          🔥 Trend
        </span>

        <h2 className="mt-3 flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
          <span className="text-2xl">🌙</span>
          <span className="text-gradient-neon">Gece İtirafları</span>
        </h2>
        <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-slate-300/85 sm:text-sm">
          Gecenin sessizliğinde, en derin itiraflar.
        </p>

        {/* CTA + live count */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="#feed"
            className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-glow-sm"
          >
            Keşfet
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-semibold text-emerald-300">{totalCount > 1000 ? `${(totalCount / 1000).toFixed(1)}K` : totalCount}</span>
            <span>itiraf · şu an aktif</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKELETON & EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="glass-card p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-2 w-16 animate-pulse rounded-full bg-white/5" />
        </div>
        <div className="h-5 w-16 animate-pulse rounded-full bg-white/5" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/5" />
      </div>
    </div>
  );
}

function EmptyState({ filter, notFollowingAnyone, href }: { filter: ExtendedFilter; notFollowingAnyone: boolean; href: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card flex flex-col items-center gap-4 py-12 text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3.5 }}
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-500/30 bg-brand-500/10 text-3xl shadow-glow-sm"
      >
        {filter === "following" ? "👥" : filter === "today" ? "☀️" : "✨"}
      </motion.div>
      <div>
        <p className="font-semibold text-white">
          {filter === "following"
            ? notFollowingAnyone
              ? "Henüz kimseyi takip etmiyorsun"
              : "Takip ettiklerinden içerik yok"
            : filter === "today"
              ? "Bugün öne çıkan itiraf yok"
              : "Henüz itiraf yok"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {filter === "following"
            ? notFollowingAnyone
              ? "Keşfet'ten ilgini çeken profilleri takip et."
              : "Takip ettiklerinin henüz açık paylaşımı yok."
            : "İlk itirafı sen paylaş!"}
        </p>
      </div>
      {filter !== "following" && (
        <Link href={href} className="btn-premium px-5 py-2.5 text-sm">
          <PlusCircleIcon className="h-4 w-4" />
          İlk itirafı yaz
        </Link>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILTER ICONS — emoji map for premium feel
   ═══════════════════════════════════════════════════════════════ */
const FILTER_ICON: Record<ExtendedFilter, string> = {
  new: "✨",
  following: "👁️",
  hot: "🔥",
  today: "🏆",
  trend: "📈",
  likes: "❤️",
  comments: "💬",
};

const FILTER_LABEL: Record<ExtendedFilter, string> = {
  new: "Yeni",
  following: "Takip",
  hot: "Alev Alanlar",
  today: "Popüler",
  trend: "Trend",
  likes: "En Beğenilen",
  comments: "En Yorumlanan",
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ConfessionsPage() {
  const { user } = useAuth();
  const [confessions, setConfessions] = useState<ConfessionRecord[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<ExtendedFilter>("new");
  const [category, setCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFollowingAnyone, setNotFollowingAnyone] = useState(false);

  const night = isNightHours();

  const loadLikes = useCallback(async () => {
    if (!user) { setLikedIds(new Set()); return; }
    const { data: likes } = await supabase
      .from("confession_likes")
      .select("confession_id")
      .eq("user_id", user.id);
    setLikedIds(new Set((likes ?? []).map((l) => l.confession_id as string)));
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFollowingAnyone(false);

    const blocked = user ? await getBlockedIds(user.id) : new Set<string>();

    if (filter === "following") {
      if (!user) {
        setConfessions([]); setNotFollowingAnyone(true); setLoading(false); return;
      }
      const { data: follows } = await supabase
        .from("follows").select("following_id").eq("follower_id", user.id);
      const ids = (follows ?? []).map((f) => f.following_id as string);
      if (ids.length === 0) {
        setConfessions([]); setNotFollowingAnyone(true); setLoading(false); return;
      }
      let q = supabase.from("confessions").select(CONF_SELECT)
        .in("user_id", ids).eq("is_anonymous", false).eq("moderation_status", "approved")
        .or(nonExpiredFilter());
      if (category) q = q.or(`category.eq.${category},mood_tag.eq.${category}`);
      const { data, error } = await q.order("created_at", { ascending: false }).limit(60);
      if (error) { setError("İtiraflar yüklenemedi. Lütfen tekrar dene."); setLoading(false); return; }
      setConfessions(((data as ConfessionRecord[]) ?? []).filter((r) => !blocked.has(r.user_id) && !r.plus_room_type));
      await loadLikes(); setLoading(false); return;
    }

    let query = supabase.from("confessions").select(CONF_SELECT).or(nonExpiredFilter());
    if (category) query = query.or(`category.eq.${category},mood_tag.eq.${category}`);
    if (filter === "likes") query = query.order("like_count", { ascending: false });
    else if (filter === "comments") query = query.order("comment_count", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error } = await query.limit(60);
    if (error) { setError("İtiraflar yüklenemedi. Lütfen tekrar dene."); setLoading(false); return; }
    let rows = (data as ConfessionRecord[]) ?? [];
    rows = rows.filter((r) => (r.moderation_status ?? "approved") === "approved" && !blocked.has(r.user_id) && !r.plus_room_type);
    if (filter === "trend") rows = sortByTrend(rows);
    else if (filter === "hot") rows = sortByHot(rows);
    else if (filter === "today") rows = sortByHot(rows.filter((r) => isFromToday(r.created_at)));
    else if (filter === "new" && user) rows = await getExploreFeed(user.id, rows);

    // Boost'lu (süresi dolmamış) itiraflar her filtrede en üste taşınır (stabil sıra korunur).
    rows = [...rows.filter((r) => isBoosted(r.boosted_until)), ...rows.filter((r) => !isBoosted(r.boosted_until))];

    setConfessions(rows.slice(0, 50));
    await loadLikes();
    setLoading(false);
  }, [user, filter, category, loadLikes]);

  useEffect(() => { load(); }, [load]);

  return (
    <Container>
      {/* Sayfaya özel cinematic glow blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-20 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(168,85,247,0.18), transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-24 top-1/2 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)" }}
        />
      </div>

      <div className="py-5">
        {/* ── HERO HEADER ────────────────────────────────────────── */}
        <HeroHeader />

        {/* ── HERO CARD (Gece İtirafları) ────────────────────────── */}
        <NightHeroCard totalCount={confessions.length > 0 ? confessions.length * 640 : 32800} />

        {/* ── FILTER PILLS ───────────────────────────────────────── */}
        <div className="-mx-1 mb-3 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible">
          {extendedFilters.map((f, i) => {
            const active = filter === f.value;
            const icon = FILTER_ICON[f.value];
            const label = FILTER_LABEL[f.value];
            return (
              <motion.button
                key={f.value}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(f.value)}
                className={`group relative shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  active
                    ? "text-white"
                    : "border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur-md hover:bg-white/[0.08] hover:text-white"
                }`}
                style={
                  active
                    ? {
                        background: "linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(124,58,237,0.55) 100%)",
                        border: "1px solid rgba(168,85,247,0.7)",
                        boxShadow: "0 0 20px -4px rgba(168,85,247,0.7), inset 0 1px 0 rgba(255,255,255,0.2)",
                      }
                    : undefined
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-sm">{icon}</span>
                  <span>{label}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* ── CATEGORY PILLS (with emojis) ───────────────────────── */}
        <div className="-mx-1 mb-6 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible">
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCategory(null)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
              category === null
                ? "border border-brand-400/60 bg-brand-500/20 text-brand-100 shadow-glow-sm"
                : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
            }`}
          >
            ✨ Tümü
          </motion.button>
          {CATEGORIES.map((c, i) => {
            const active = category === c.value;
            return (
              <motion.button
                key={c.value}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCategory(c.value)}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "border border-brand-400/60 bg-brand-500/20 text-brand-100 shadow-glow-sm"
                    : "border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                }`}
              >
                <span className="mr-1">{c.emoji}</span>
                {c.filterLabel ?? c.value}
              </motion.button>
            );
          })}
        </div>

        {/* ── FEED ───────────────────────────────────────────────── */}
        <div id="feed">
          {loading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : error ? (
            <div className="glass-card flex flex-col items-center gap-3 p-6 text-center text-sm text-red-300">
              <span>{error}</span>
              <button type="button" onClick={() => load()} className="btn-ghost px-5 py-2 text-xs">
                ↻ Tekrar dene
              </button>
            </div>
          ) : confessions.length === 0 ? (
            <EmptyState filter={filter} notFollowingAnyone={notFollowingAnyone} href="/confessions/new" />
          ) : (
            <div className="space-y-4">
              {confessions.map((c, i) => (
                <div key={c.id} className="space-y-4">
                  <FeedCard confession={c} liked={likedIds.has(c.id)} />
                  {i > 0 && (i + 1) % 6 === 0 && <AdSlot />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Night mode indicator (00-05) */}
        {night && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-2xl border border-brand-500/30 bg-brand-500/10 p-3 text-center text-xs text-brand-200"
          >
            🌙 Gece modundasın · 00:00–05:00 arası özel atmosfer
          </motion.div>
        )}
      </div>
    </Container>
  );
}
