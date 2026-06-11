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

      {/* Gece manzarası — aurora + hilal + katmanlı şehir + sis */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {/* Aurora ışık bantları (yavaşça süzülür) */}
        <motion.div
          animate={{ x: [0, 22, 0], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 right-[10%] h-52 w-80 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(168,85,247,0.38), transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -18, 0], opacity: [0.3, 0.55, 0.3] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -top-8 right-[38%] h-44 w-64 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(236,72,153,0.22), transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, 14, 0], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-2 left-[5%] h-36 w-72 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.18), transparent 70%)" }}
        />

        {/* Kayan yıldız (periyodik) */}
        <span className="absolute right-[14%] top-[16%] rotate-[28deg]">
          <motion.span
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: [30, -150], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 7, ease: "easeOut", delay: 3 }}
            className="block h-px w-20"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.95), rgba(196,181,253,0.4))",
              boxShadow: "0 0 6px rgba(255,255,255,0.6)",
            }}
          />
        </span>

        {/* Hilal — temiz SVG kesim + çift halo */}
        <motion.svg
          viewBox="0 0 100 100"
          className="absolute right-6 top-4 h-20 w-20 sm:right-11 sm:top-6 sm:h-28 sm:w-28"
          animate={{ y: [0, -4, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            filter:
              "drop-shadow(0 0 16px rgba(252,211,77,0.55)) drop-shadow(0 0 44px rgba(168,85,247,0.38))",
          }}
        >
          <defs>
            <linearGradient id="nh-moon" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fffbe8" />
              <stop offset="55%" stopColor="#fde68a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <mask id="nh-crescent">
              <rect width="100" height="100" fill="white" />
              <circle cx="36" cy="40" r="33" fill="black" />
            </mask>
          </defs>
          <circle cx="50" cy="50" r="37" fill="url(#nh-moon)" mask="url(#nh-crescent)" />
        </motion.svg>

        {/* Şehir — arka katman (flu, menekşe) */}
        <svg
          viewBox="0 0 420 110"
          preserveAspectRatio="none"
          className="absolute bottom-0 right-0 h-20 w-[78%] opacity-50 blur-[2px] sm:h-28"
        >
          <path
            d="M0,110 L0,76 L26,76 L26,58 L48,58 L48,70 L74,70 L74,44 L96,44 L96,62 L122,62 L122,50 L150,50 L150,66 L178,66 L178,38 L202,38 L202,58 L232,58 L232,46 L262,46 L262,64 L292,64 L292,40 L318,40 L318,56 L348,56 L348,68 L378,68 L378,52 L420,52 L420,110 Z"
            fill="#4338ca"
          />
        </svg>

        {/* Şehir — ön katman (koyu, anten + ışıklı pencereler) */}
        <svg
          viewBox="0 0 420 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 right-0 h-24 w-[70%] sm:h-32"
        >
          <defs>
            <linearGradient id="nh-city" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#221d4e" />
              <stop offset="100%" stopColor="#0b0817" />
            </linearGradient>
          </defs>
          {/* Anten / kule uçları */}
          <rect x="118" y="16" width="2" height="26" fill="#221d4e" />
          <circle cx="119" cy="14" r="2.4" fill="#f472b6">
            <animate attributeName="opacity" values="1;0.25;1" dur="2.4s" repeatCount="indefinite" />
          </circle>
          <rect x="298" y="10" width="2" height="24" fill="#221d4e" />
          <circle cx="299" cy="8" r="2.4" fill="#fb7185">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
          <path
            d="M0,120 L0,86 L20,86 L20,64 L34,64 L34,58 L40,52 L46,58 L46,78 L66,78 L66,42 L70,38 L88,38 L88,56 L106,56 L106,42 L132,42 L132,72 L148,72 L148,50 L154,44 L168,44 L168,60 L186,60 L186,34 L206,34 L206,52 L224,52 L224,68 L244,68 L244,46 L250,40 L268,40 L268,58 L286,58 L286,34 L312,34 L312,54 L332,54 L332,70 L354,70 L354,58 L376,58 L376,76 L398,76 L398,64 L420,64 L420,120 Z"
            fill="url(#nh-city)"
          />
          {/* Pencere ışıkları — sıcak, kademeli yanıp sönme */}
          {[
            [26, 72, 0], [30, 80, 1], [56, 84, 2], [74, 48, 3], [80, 60, 4],
            [96, 46, 0], [112, 62, 1], [124, 50, 2], [140, 78, 3], [160, 52, 4],
            [176, 66, 0], [194, 42, 1], [198, 56, 2], [214, 60, 3], [232, 74, 4],
            [256, 48, 0], [276, 64, 1], [294, 42, 2], [302, 58, 3], [320, 60, 4],
            [340, 76, 0], [362, 64, 1], [384, 82, 2], [404, 72, 3],
          ].map(([x, y, g], i) => (
            <rect key={i} x={x} y={y} width="2.6" height="3" rx="0.6" fill="#fde68a" opacity="0.9">
              <animate
                attributeName="opacity"
                values={g % 2 === 0 ? "0.9;0.25;0.9" : "0.3;0.95;0.3"}
                dur={`${2.2 + (g as number) * 0.7}s`}
                begin={`${i * 0.18}s`}
                repeatCount="indefinite"
              />
            </rect>
          ))}
        </svg>

        {/* Süzülen sis bandı + zemin sisi */}
        <motion.div
          animate={{ x: [0, 36, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-4 inset-x-0 h-10 blur-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent 5%, rgba(168,85,247,0.16) 35%, rgba(96,165,250,0.12) 65%, transparent 95%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-14"
          style={{ background: "linear-gradient(to top, rgba(8,6,18,0.8), transparent)" }}
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

        <h2
          className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ filter: "drop-shadow(0 2px 14px rgba(168,85,247,0.45))" }}
        >
          <span className="text-gradient-neon">Gece İtirafları</span>
        </h2>
        <p className="mt-1.5 max-w-[260px] text-xs leading-relaxed text-slate-300/85 sm:text-sm">
          Gecenin sessizliğinde, en derin itiraflar.
        </p>

        {/* CTA + live count */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="#feed"
            className="group inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold text-white transition-all hover:scale-[1.04] active:scale-95"
            style={{
              background: "linear-gradient(135deg, #a855f7 0%, #7c3aed 55%, #6d28d9 100%)",
              boxShadow: "0 0 24px -6px rgba(168,85,247,0.7), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
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
    // "Yeni" salt kronolojiktir (sorgu zaten created_at desc) — kişiselleştirilmiş
    // sıralama "Sana Özel" sayfasında yaşar. Aksi hâlde yüksek beğenili eski
    // itiraflar 0 beğenili taze paylaşımları listenin dışına itiyordu.

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
