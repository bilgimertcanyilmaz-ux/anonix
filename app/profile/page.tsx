"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { Button, LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { rankIcon, getNextRank, getRankProgress, getRemainingXP } from "@/lib/ranks";
import { getFollowCounts, type FollowCounts } from "@/lib/follows";
import { badgeIcon } from "@/lib/badges";
import { CrownIcon, SparkIcon } from "@/components/ui/icons";
import { ProfileFrame } from "@/components/profile/ProfileFrame";
import { FramedAvatar } from "@/components/profile/FramedAvatar";
import { getPremiumTheme } from "@/lib/themes";
import { GenderBadge } from "@/components/profile/GenderBadge";
import { ProfileSetup } from "@/components/profile/ProfileSetup";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { SubscriptionFeatures } from "@/components/premium/SubscriptionFeatures";
import { getEffectiveTier, TIER_LABELS } from "@/lib/subscription";
import { Footer } from "@/components/layout/Footer";
import { PushPermissionButton } from "@/components/pwa/PushPermissionButton";
import type { UserBadge, ConfessionRecord } from "@/types";

/* ═══════════════════════════════════════════════════════════════
   RARITY SYSTEM — collectible feel
   ═══════════════════════════════════════════════════════════════ */
type Rarity = {
  label: string;
  text: string;
  bg: string;
  border: string;
  glow: string;
};
function rarityOf(badgeType?: string | null): Rarity {
  switch (badgeType) {
    case "special":
      return {
        label: "Efsanevi",
        text: "#fcd34d",
        bg: "linear-gradient(135deg, rgba(252,211,77,0.3), rgba(245,158,11,0.2))",
        border: "rgba(252,211,77,0.65)",
        glow: "0 0 24px -4px rgba(252,211,77,0.6)",
      };
    case "rank":
      return {
        label: "Epik",
        text: "#c4b5fd",
        bg: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(91,33,182,0.2))",
        border: "rgba(167,139,250,0.65)",
        glow: "0 0 24px -4px rgba(139,92,246,0.6)",
      };
    case "points":
      return {
        label: "Nadir",
        text: "#93c5fd",
        bg: "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(29,78,216,0.2))",
        border: "rgba(96,165,250,0.65)",
        glow: "0 0 24px -4px rgba(59,130,246,0.6)",
      };
    case "streak":
      return {
        label: "Bronz",
        text: "#fdba74",
        bg: "linear-gradient(135deg, rgba(251,146,60,0.3), rgba(154,52,18,0.2))",
        border: "rgba(251,146,60,0.65)",
        glow: "0 0 20px -4px rgba(251,146,60,0.5)",
      };
    default:
      return {
        label: "Yaygın",
        text: "#cbd5e1",
        bg: "linear-gradient(135deg, rgba(148,163,184,0.25), rgba(71,85,105,0.2))",
        border: "rgba(148,163,184,0.5)",
        glow: "0 0 16px -4px rgba(148,163,184,0.4)",
      };
  }
}

/* ═══════════════════════════════════════════════════════════════
   CYBERPUNK CITY BACKDROP — hero background
   ═══════════════════════════════════════════════════════════════ */
function CityBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
      {/* Aurora glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 30%, rgba(236,72,153,0.18) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(124,58,237,0.25) 0%, transparent 55%), radial-gradient(ellipse at 60% 90%, rgba(59,130,246,0.15) 0%, transparent 50%)",
        }}
      />
      {/* Stars */}
      {[
        { l: "15%", t: "20%", s: 1 },
        { l: "35%", t: "15%", s: 2 },
        { l: "62%", t: "25%", s: 1 },
        { l: "80%", t: "12%", s: 2 },
        { l: "92%", t: "35%", s: 1 },
        { l: "70%", t: "55%", s: 1 },
      ].map((s, i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
          className="absolute rounded-full bg-white"
          style={{
            left: s.l,
            top: s.t,
            width: `${s.s}px`,
            height: `${s.s}px`,
            boxShadow: `0 0 ${s.s * 4}px rgba(255,255,255,0.8)`,
          }}
        />
      ))}
      {/* City silhouette right edge */}
      <svg
        viewBox="0 0 400 120"
        className="absolute bottom-0 right-0 h-32 w-3/5"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="profile-city" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0f0a1f" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <path
          d="M0,120 L0,90 L18,90 L18,70 L32,70 L32,80 L48,80 L48,55 L62,55 L62,65 L80,65 L80,42 L95,42 L95,58 L112,58 L112,70 L130,70 L130,52 L150,52 L150,65 L172,65 L172,38 L188,38 L188,55 L210,55 L210,32 L228,32 L228,48 L248,48 L248,68 L268,68 L268,55 L288,55 L288,62 L308,62 L308,42 L328,42 L328,58 L348,58 L348,72 L370,72 L370,62 L390,62 L390,78 L400,78 L400,120 Z"
          fill="url(#profile-city)"
        />
        {/* Window lights */}
        {[
          [22, 100], [40, 80], [55, 70], [70, 65], [85, 55], [100, 70], [120, 80],
          [140, 70], [160, 60], [180, 50], [200, 65], [220, 45], [235, 60],
          [255, 75], [275, 60], [295, 70], [315, 55], [335, 70], [355, 80], [375, 70],
        ].map(([x, y], i) => (
          <motion.rect
            key={i}
            x={x}
            y={y}
            width="1.2"
            height="1.2"
            fill="#fde68a"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </svg>
      {/* Subtle noise */}
      <div className="noise-overlay opacity-30" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AVATAR WITH NEON RING — animated rotating border + online dot
   ═══════════════════════════════════════════════════════════════ */
function NeonAvatarRing({
  children,
  ultra = false,
  gender,
}: {
  children: React.ReactNode;
  ultra?: boolean;
  gender?: string | null;
}) {
  const colors = ultra
    ? ["#fcd34d", "#a855f7", "#fcd34d"]
    : gender === "Erkek"
      ? ["#3b82f6", "#8b5cf6", "#06b6d4"]
      : gender === "Kadın"
        ? ["#ec4899", "#a855f7", "#f472b6"]
        : ["#a855f7", "#ec4899", "#3b82f6"];

  return (
    <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
      {/* Outer rotating conic gradient ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${colors[0]}, ${colors[1]}, ${colors[2]}, ${colors[0]})`,
          padding: "3px",
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      {/* Soft outer glow halo */}
      <motion.div
        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${colors[1]}66, transparent 70%)`,
        }}
      />
      {/* Inner avatar */}
      <div className="absolute inset-[6px] overflow-hidden rounded-full bg-ink-950">
        {children}
      </div>
      {/* Online indicator */}
      <span className="absolute bottom-1 right-1 z-10 h-4 w-4 rounded-full border-2 border-ink-950 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACTION BUTTON — glass circle with icon + label
   ═══════════════════════════════════════════════════════════════ */
function ActionButton({
  emoji,
  label,
  href,
  onClick,
}: {
  emoji: string;
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <motion.span
        whileHover={{ scale: 1.08, y: -2 }}
        whileTap={{ scale: 0.92 }}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-lg backdrop-blur-md transition-all duration-200 group-hover:border-brand-400/60 group-hover:bg-brand-500/15 group-hover:shadow-glow-sm"
      >
        <span className="filter drop-shadow-[0_0_4px_rgba(168,85,247,0.4)]">{emoji}</span>
      </motion.span>
      <span className="text-[10px] font-semibold text-slate-300 transition-colors group-hover:text-white">
        {label}
      </span>
    </>
  );
  const cls = "group flex flex-col items-center gap-1.5";
  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{inner}</button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEX RANK EMBLEM — hexagon shape with icon + glow
   ═══════════════════════════════════════════════════════════════ */
function HexRankEmblem({ icon, ultra }: { icon: string; ultra?: boolean }) {
  const fill = ultra
    ? "linear-gradient(135deg, #fcd34d 0%, #a855f7 100%)"
    : "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)";
  const glow = ultra ? "rgba(252,211,77,0.5)" : "rgba(168,85,247,0.6)";
  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative flex h-20 w-20 shrink-0 items-center justify-center"
    >
      {/* Outer hexagon glow layer */}
      <span
        className="absolute inset-0"
        style={{
          clipPath: "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
          background: fill,
          opacity: 0.25,
          filter: "blur(8px)",
        }}
      />
      {/* Hexagon body */}
      <span
        className="absolute inset-0"
        style={{
          clipPath: "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
          background: fill,
          boxShadow: `0 0 30px -4px ${glow}`,
        }}
      />
      {/* Inner glass overlay */}
      <span
        className="absolute inset-[3px]"
        style={{
          clipPath: "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
          background: "linear-gradient(135deg, rgba(15,10,30,0.85), rgba(30,27,75,0.7))",
          backdropFilter: "blur(6px)",
        }}
      />
      <span className="relative text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{icon}</span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GRADIENT STAT CARD — 4-up colored cards
   ═══════════════════════════════════════════════════════════════ */
function GradientStatCard({
  emoji,
  value,
  label,
  msg,
  tone,
}: {
  emoji: string;
  value: number | string;
  label: string;
  msg?: string;
  tone: "pink" | "blue" | "purple" | "gold";
}) {
  const tones: Record<typeof tone, { bg: string; ring: string; glow: string; chipBg: string }> = {
    pink: {
      bg: "linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(190,24,93,0.12) 100%)",
      ring: "rgba(236,72,153,0.4)",
      glow: "0 0 24px -8px rgba(236,72,153,0.55)",
      chipBg: "linear-gradient(135deg, #ec4899, #be185d)",
    },
    blue: {
      bg: "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(29,78,216,0.12) 100%)",
      ring: "rgba(59,130,246,0.4)",
      glow: "0 0 24px -8px rgba(59,130,246,0.55)",
      chipBg: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    },
    purple: {
      bg: "linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(91,33,182,0.12) 100%)",
      ring: "rgba(168,85,247,0.45)",
      glow: "0 0 24px -8px rgba(168,85,247,0.6)",
      chipBg: "linear-gradient(135deg, #a855f7, #6d28d9)",
    },
    gold: {
      bg: "linear-gradient(135deg, rgba(252,211,77,0.22) 0%, rgba(180,83,9,0.12) 100%)",
      ring: "rgba(252,211,77,0.5)",
      glow: "0 0 24px -8px rgba(252,211,77,0.6)",
      chipBg: "linear-gradient(135deg, #fcd34d, #b45309)",
    },
  };
  const t = tones[tone];
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="relative overflow-hidden rounded-2xl p-3 backdrop-blur-md sm:p-4"
      style={{
        background: t.bg,
        border: `1px solid ${t.ring}`,
        boxShadow: t.glow,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg shadow-md"
          style={{
            background: t.chipBg,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 12px -2px ${t.ring}`,
          }}
        >
          {emoji}
        </span>
        <span className="text-2xl font-extrabold text-white sm:text-3xl">{value}</span>
      </div>
      <p className="mt-2 text-xs font-bold text-white/90">{label}</p>
      {msg && <p className="mt-0.5 text-[10px] text-white/55">{msg}</p>}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HEX BADGE — hexagonal collectible card
   ═══════════════════════════════════════════════════════════════ */
function HexBadge({ ub, i }: { ub: UserBadge; i: number }) {
  const r = rarityOf(ub.badges?.badge_type);
  const emoji = ub.badges ? badgeIcon(ub.badges) : "🏅";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ y: -4, scale: 1.04 }}
      className="group flex shrink-0 flex-col items-center gap-1.5"
    >
      <div className="relative h-16 w-16">
        {/* Hex glow */}
        <span
          className="absolute inset-0 transition-opacity group-hover:opacity-100"
          style={{
            clipPath: "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
            background: r.bg,
            boxShadow: r.glow,
            opacity: 0.85,
          }}
        />
        {/* Inner glass */}
        <span
          className="absolute inset-[2px]"
          style={{
            clipPath: "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
            background: "linear-gradient(135deg, rgba(15,10,30,0.75), rgba(30,27,75,0.55))",
            border: `1px solid ${r.border}`,
          }}
        />
        {/* Holographic shine */}
        <motion.span
          aria-hidden
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          className="absolute inset-[2px]"
          style={{
            clipPath: "polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)",
            background: "linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)",
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          {emoji}
        </span>
      </div>
      <span className="max-w-[68px] truncate text-[11px] font-bold text-white">
        {ub.badges?.name ?? "Rozet"}
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: r.text }}>
        {r.label}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY ITEM — timeline row
   ═══════════════════════════════════════════════════════════════ */
function ActivityItem({
  emoji,
  title,
  time,
  snippet,
  count,
  i,
}: {
  emoji: string;
  title: string;
  time: string;
  snippet?: string;
  count?: number;
  i: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.06 }}
      className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-all hover:border-brand-400/30 hover:bg-white/[0.06]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base"
        style={{
          background: "linear-gradient(135deg, rgba(168,85,247,0.25), rgba(124,58,237,0.15))",
          border: "1px solid rgba(168,85,247,0.35)",
          boxShadow: "0 0 12px -4px rgba(168,85,247,0.5)",
        }}
      >
        {emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{title}</p>
        <p className="text-[10px] text-slate-400">{time}</p>
        {snippet && (
          <p className="mt-1 line-clamp-2 text-xs italic text-slate-300/90">&ldquo;{snippet}&rdquo;</p>
        )}
      </div>
      {typeof count === "number" && count > 0 && (
        <span className="inline-flex shrink-0 items-center gap-1 self-center rounded-full border border-pink-400/40 bg-pink-500/15 px-2 py-1 text-[10px] font-bold text-pink-200">
          ❤️ {count}
        </span>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TOGGLE ROW — keep existing
   ═══════════════════════════════════════════════════════════════ */
function ToggleRow({
  title, desc, on, onToggle, disabled,
}: {
  title: string; desc: string; on: boolean; onToggle: () => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-4 text-left disabled:opacity-60"
    >
      <span>
        <span className="block text-sm font-semibold text-white">{title}</span>
        <span className="block text-xs text-slate-400">{desc}</span>
      </span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${on ? "bg-brand-500 shadow-glow-sm" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 260, damping: 24, delay: i * 0.07 } }),
};

/* ═══════════════════════════════════════════════════════════════
   MAIN PROFILE PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading, signOut, updateProfile, refreshProfile } = useAuth();
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [referralCount, setReferralCount] = useState(0);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [activities, setActivities] = useState<ConfessionRecord[]>([]);
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const { success: toastSuccess, error: toastErr } = useToast();
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") {
      toastSuccess("Aboneliğin aktif edildi! 👑");
      refreshProfile();
      window.history.replaceState({}, "", "/profile");
    } else if (status === "failed") {
      toastErr("Ödeme tamamlanamadı. Tekrar deneyebilirsin.");
      window.history.replaceState({}, "", "/profile");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [{ data: bData }, { count }, fc, { data: aData }] = await Promise.all([
      supabase.from("user_badges").select("*, badges(*)").eq("user_id", user.id).order("earned_at", { ascending: false }),
      supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
      getFollowCounts(user.id),
      supabase.from("confessions").select("id, content, created_at, like_count, comment_count").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
    ]);
    setBadges((bData as UserBadge[]) ?? []);
    setReferralCount(count ?? 0);
    setFollowCounts(fc);
    setActivities(((aData as ConfessionRecord[]) ?? []));
  }, [user]);

  useEffect(() => { if (user) loadData(); }, [user, loadData]);
  useEffect(() => { const t = setTimeout(() => setBarReady(true), 200); return () => clearTimeout(t); }, []);

  if (loading || !user) {
    return (
      <Container>
        <div className="py-20 text-center">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-brand-500/20" />
          <p className="mt-4 text-sm text-slate-400">Yükleniyor...</p>
        </div>
      </Container>
    );
  }

  if (!profile) return <Container><ProfileSetup /></Container>;

  async function handleToggleAnonymous() {
    if (!profile) return;
    setError(null); setToggling(true);
    const result = await updateProfile({ is_anonymous: !profile.is_anonymous });
    setToggling(false);
    if (result.error) setError(result.error);
  }

  async function handleSignOut() { await signOut(); router.push("/"); }

  async function handleShareProfile() {
    const url = `${window.location.origin}/users/${profile?.username}`;
    if (navigator.share) {
      try { await navigator.share({ title: `@${profile?.username}`, url }); }
      catch { /* user cancelled */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      toastSuccess("Profil bağlantısı kopyalandı!");
    }
  }

  const tier = getEffectiveTier(profile);
  const next = getNextRank(profile.points);
  const pct = getRankProgress(profile.points);
  const remaining = getRemainingXP(profile.points);
  const isUltra = tier === "ultra_plus";
  const isPlus = tier === "plus";

  // Compute level from points (rough heuristic)
  const level = Math.max(1, Math.floor(profile.points / 500) + 1);

  // Format time helper
  const timeAgo = (iso: string) => {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return "az önce";
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
    return `${Math.floor(diff / 86400)} gün önce`;
  };

  return (
    <>
      <Container>
        <div className="space-y-4 py-4">

          {/* ═══════════════ HERO SECTION ═══════════════ */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={0}
            className="anonix-dark-card relative overflow-hidden rounded-3xl border border-white/10 p-5"
            style={{
              background: "linear-gradient(180deg, rgba(30,27,75,0.45) 0%, rgba(15,10,35,0.7) 100%)",
              boxShadow: "0 0 60px -20px rgba(124,58,237,0.5), 0 30px 60px -30px rgba(0,0,0,0.6)",
            }}
          >
            <CityBackdrop />

            {/* Avatar + identity row */}
            <div className="relative flex items-start gap-4">
              {(() => {
                const avatarInner = profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={profile.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-accent-500 text-2xl font-extrabold text-white">
                    {profile.username[0]?.toUpperCase()}
                  </div>
                );
                // Premium rütbe çerçevesi seçiliyse onu göster, yoksa neon halka.
                return getPremiumTheme(profile.premium_theme) ? (
                  <FramedAvatar themeId={profile.premium_theme} size={132}>
                    {avatarInner}
                  </FramedAvatar>
                ) : (
                  <NeonAvatarRing ultra={isUltra} gender={profile.gender}>
                    {avatarInner}
                  </NeonAvatarRing>
                );
              })()}

              <div className="relative min-w-0 flex-1 pt-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h1 className="truncate text-2xl font-extrabold sm:text-3xl"
                    style={{
                      background: "linear-gradient(135deg, #fff 0%, #e9d5ff 50%, #c084fc 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: "drop-shadow(0 0 12px rgba(168,85,247,0.4))",
                    }}
                  >
                    @{profile.username}
                  </h1>
                  {isUltra ? (
                    <motion.span
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ repeat: Infinity, duration: 2.5 }}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: "linear-gradient(135deg, #fcd34d, #f59e0b)",
                        color: "#451a03",
                        boxShadow: "0 0 16px -4px rgba(252,211,77,0.8)",
                      }}
                    >
                      <CrownIcon className="h-3 w-3" /> Ultra Plus
                    </motion.span>
                  ) : isPlus ? (
                    <span
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{
                        background: "linear-gradient(135deg, #a855f7, #6d28d9)",
                        boxShadow: "0 0 16px -4px rgba(168,85,247,0.7)",
                      }}
                    >
                      <SparkIcon className="h-3 w-3" /> Plus
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                      ✨ Ücretsiz
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <GenderBadge gender={profile.gender} />
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${profile.is_anonymous ? "bg-white/10 text-slate-300" : "bg-emerald-500/15 text-emerald-300"}`}>
                    {profile.is_anonymous ? "🎭 Anonim" : "👁️ Herkese açık"}
                  </span>
                </div>

                {/* Follow stats */}
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <Link href="/profile/followers" className="group flex items-center gap-1 transition-colors">
                    <span className="font-bold text-white group-hover:text-brand-300">{followCounts.followers}</span>
                    <span className="text-slate-400">Takipçi</span>
                  </Link>
                  <span className="h-3 w-px bg-white/10" />
                  <Link href="/profile/following" className="group flex items-center gap-1 transition-colors">
                    <span className="font-bold text-white group-hover:text-brand-300">{followCounts.following}</span>
                    <span className="text-slate-400">Takip</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Action buttons row */}
            <div className="relative mt-5 flex items-start justify-around gap-1 border-t border-white/8 pt-4">
              <ActionButton emoji="✏️" label="Düzenle" href="/complete-profile" />
              <ActionButton emoji="👻" label="Hayalet" href={isUltra ? "/settings/privacy" : "/plus"} />
              <ActionButton emoji="🎨" label="Temalar" href="/settings/themes" />
              <ActionButton emoji="📤" label="Paylaş" onClick={handleShareProfile} />
              <ActionButton emoji="📊" label="İstatistik" href="/profile/analytics" />
            </div>
          </motion.div>

          {/* ═══════════════ XP / RANK CARD ═══════════════ */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="anonix-dark-card relative overflow-hidden rounded-3xl border border-white/10 p-5"
            style={{
              background: "linear-gradient(135deg, rgba(30,27,75,0.55) 0%, rgba(15,10,35,0.7) 100%)",
              boxShadow: "0 0 40px -16px rgba(168,85,247,0.4)",
            }}
          >
            <div className="flex items-center gap-4">
              <HexRankEmblem icon={rankIcon(profile.rank)} ultra={isUltra} />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Rütbe</p>
                <h2 className="flex items-center gap-1.5 text-xl font-extrabold text-white sm:text-2xl">
                  <span className="text-gradient-neon">{profile.rank}</span>
                  <span className="text-base">{rankIcon(profile.rank)}</span>
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">Seviye {level}</p>

                {/* Progress bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-black/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: barReady ? `${pct}%` : "0%" }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                      className="relative h-full overflow-hidden rounded-full"
                      style={{
                        background: isUltra
                          ? "linear-gradient(90deg, #fcd34d, #a855f7, #ec4899)"
                          : "linear-gradient(90deg, #a855f7, #6366f1, #ec4899)",
                        boxShadow: "0 0 12px rgba(168,85,247,0.6)",
                      }}
                    >
                      {/* shimmer overlay */}
                      <motion.span
                        animate={{ x: ["-100%", "200%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-y-0 w-1/3"
                        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }}
                      />
                    </motion.div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {next ? `${remaining.toLocaleString("tr-TR")} XP kaldı · %${pct}` : "Tüm rütbeleri tamamladın! 🏆"}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Toplam XP</p>
                <motion.p
                  className="text-2xl font-extrabold sm:text-3xl"
                  style={{
                    background: "linear-gradient(135deg, #c084fc 0%, #ec4899 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  {profile.points.toLocaleString("tr-TR")}
                </motion.p>
                {profile.is_anonymous && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    ✍️ Gizli Yazar
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* ═══════════════ 4 GRADIENT STAT CARDS ═══════════════ */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <GradientStatCard
              emoji="🔥"
              value={profile.streak_count}
              label="Günlük Streak"
              msg="Tebrikler!"
              tone="pink"
            />
            <GradientStatCard
              emoji="👥"
              value={followCounts.followers}
              label="Takipçi"
              msg="Topluluğun büyüyor"
              tone="blue"
            />
            <GradientStatCard
              emoji="⚡"
              value={profile.points.toLocaleString("tr-TR")}
              label="Toplam XP"
              msg="Harika gidiyorsun! ✨"
              tone="purple"
            />
            <GradientStatCard
              emoji="🏆"
              value={badges.length}
              label="Rozet"
              msg="Koleksiyonun harika!"
              tone="gold"
            />
          </motion.div>

          {/* ═══════════════ ROZETLERIM (Hex) ═══════════════ */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <CrownIcon className="h-4 w-4 text-amber-300" />
                Rozetlerim
              </h2>
              <Link href="/badges" className="text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200">
                Tümünü gör →
              </Link>
            </div>
            {badges.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="text-4xl opacity-50">🏅</span>
                <p className="text-xs text-slate-400">Henüz rozetin yok. İtiraf paylaş ve rozet kazan!</p>
              </div>
            ) : (
              <div className="flex flex-nowrap gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible">
                {badges.map((ub, i) => <HexBadge key={ub.id} ub={ub} i={i} />)}
              </div>
            )}
          </motion.div>

          {/* ═══════════════ SON AKTİVİTELERIM ═══════════════ */}
          {activities.length > 0 && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              custom={4}
              className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                  <SparkIcon className="h-4 w-4 text-brand-300" />
                  Son Aktivitelerim
                </h2>
                <Link href="/confessions" className="text-xs font-semibold text-brand-300 transition-colors hover:text-brand-200">
                  Tümünü gör →
                </Link>
              </div>
              <div className="space-y-2">
                {activities.slice(0, 3).map((c, i) => (
                  <ActivityItem
                    key={c.id}
                    emoji="💬"
                    title="Bir itiraf paylaştın"
                    time={timeAgo(c.created_at)}
                    snippet={c.content.length > 100 ? c.content.slice(0, 100) + "..." : c.content}
                    count={c.like_count ?? 0}
                    i={i}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════ SUBSCRIPTION ═══════════════ */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={5}>
            <SubscriptionFeatures />
          </motion.div>

          {/* ═══════════════ AVATAR PICKER ═══════════════ */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={6}>
            <AvatarPicker />
          </motion.div>

          {/* ═══════════════ MEMBERSHIP CARD ═══════════════ */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={7}
            className={`glass-card flex items-center justify-between gap-3 p-5 ${isUltra ? "glass-card-gold" : ""}`}
          >
            <div>
              <p className="text-sm font-semibold text-white">
                Üyelik · <span className={isUltra ? "text-gradient-gold" : isPlus ? "text-gradient" : "text-slate-400"}>{TIER_LABELS[tier]}</span>
              </p>
              <p className="text-xs text-slate-400">
                {isUltra ? "Tüm Ultra Plus özellikleri açık." : isPlus ? "Plus özellikleri açık." : "Premium özellikler kapalı."}
                {profile.plus_expires_at && tier !== "free" && (
                  <> · {new Date(profile.plus_expires_at).toLocaleDateString("tr-TR")} tarihine kadar</>
                )}
              </p>
            </div>
            {isUltra ? (
              <span className="chip-gold"><CrownIcon className="h-3.5 w-3.5" /> Ultra Plus</span>
            ) : (
              <LinkButton href="/plus" className="!px-4 !py-2 text-xs">
                {isPlus ? "Ultra Plus'a Geç" : "Plus'a Geç"}
              </LinkButton>
            )}
          </motion.div>

          {/* ═══════════════ SETTINGS ═══════════════ */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={8} className="glass-card space-y-5 p-5">
            <p className="text-sm font-bold text-white">Gizlilik & Ses</p>
            {error && <Alert tone="error">{error}</Alert>}
            <ToggleRow
              title={`Anonimlik ${profile.is_anonymous ? "açık" : "kapalı"}`}
              desc={profile.is_anonymous ? "Kimliğin gizli, paylaşımların rumuzla görünür." : "Profilin herkese açık görünüyor."}
              on={profile.is_anonymous}
              onToggle={handleToggleAnonymous}
              disabled={toggling}
            />
            <div className="h-px bg-white/5" />
            {(
              [
                { key: "notification_sound_enabled" as const, title: "Bildirim sesi", desc: "Yeni bildirim geldiğinde kısa bir ses çalar." },
                { key: "message_sound_enabled" as const, title: "Mesaj sesi", desc: "Yeni özel mesaj geldiğinde kısa bir ses çalar." },
              ] as const
            ).map((row, i, arr) => (
              <div key={row.key}>
                <ToggleRow
                  title={row.title}
                  desc={row.desc}
                  on={!!profile[row.key]}
                  onToggle={() => updateProfile({ [row.key]: !profile[row.key] })}
                />
                {i < arr.length - 1 && <div className="mt-5 h-px bg-white/5" />}
              </div>
            ))}
            <div className="h-px bg-white/5" />
            <PushPermissionButton />
          </motion.div>

          {/* ═══════════════ ACCOUNT ═══════════════ */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={9}>
            <Link href="/settings/account" className="glass-card glass-card-hover flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-semibold text-white">Hesap Ayarları</p>
                <p className="text-xs text-slate-400">Engellenenler ve hesap silme.</p>
              </div>
              <span className="text-brand-300">→</span>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={10}>
            <Button variant="ghost" onClick={handleSignOut} className="w-full">Çıkış yap</Button>
          </motion.div>

          {/* Referral count (preserved) */}
          {referralCount > 0 && (
            <div className="text-center text-[10px] text-slate-500">{referralCount} davet</div>
          )}
        </div>
      </Container>
      <Footer />
    </>
  );
}
