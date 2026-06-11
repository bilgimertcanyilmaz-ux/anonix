"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { badgeIcon } from "@/lib/badges";
import type { Badge } from "@/types";

/* Nadirlik sistemi — profil sayfasındaki koleksiyon hissiyle birebir uyumlu. */
type Rarity = { label: string; text: string; bg: string; border: string; glow: string; chip: string };
function rarityOf(badgeType?: string | null): Rarity {
  switch (badgeType) {
    case "special":
      return {
        label: "Efsanevi",
        text: "#fcd34d",
        bg: "linear-gradient(135deg, rgba(252,211,77,0.22), rgba(245,158,11,0.12))",
        border: "rgba(252,211,77,0.55)",
        glow: "0 0 28px -6px rgba(252,211,77,0.55)",
        chip: "linear-gradient(135deg, #fcd34d, #d97706)",
      };
    case "rank":
      return {
        label: "Epik",
        text: "#c4b5fd",
        bg: "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(91,33,182,0.12))",
        border: "rgba(167,139,250,0.55)",
        glow: "0 0 28px -6px rgba(139,92,246,0.55)",
        chip: "linear-gradient(135deg, #a78bfa, #6d28d9)",
      };
    case "points":
      return {
        label: "Nadir",
        text: "#93c5fd",
        bg: "linear-gradient(135deg, rgba(59,130,246,0.22), rgba(29,78,216,0.12))",
        border: "rgba(96,165,250,0.55)",
        glow: "0 0 28px -6px rgba(59,130,246,0.55)",
        chip: "linear-gradient(135deg, #60a5fa, #1d4ed8)",
      };
    case "streak":
      return {
        label: "Bronz",
        text: "#fdba74",
        bg: "linear-gradient(135deg, rgba(251,146,60,0.22), rgba(154,52,18,0.12))",
        border: "rgba(251,146,60,0.55)",
        glow: "0 0 24px -6px rgba(251,146,60,0.5)",
        chip: "linear-gradient(135deg, #fdba74, #c2410c)",
      };
    default:
      return {
        label: "Yaygın",
        text: "#cbd5e1",
        bg: "linear-gradient(135deg, rgba(148,163,184,0.18), rgba(71,85,105,0.12))",
        border: "rgba(148,163,184,0.45)",
        glow: "0 0 18px -6px rgba(148,163,184,0.4)",
        chip: "linear-gradient(135deg, #94a3b8, #475569)",
      };
  }
}

/** Tek rozet kartı — kazanılmışsa renkli/parlak, kilitliyse soluk + gereksinim. */
function BadgeCard({ badge, earned, i }: { badge: Badge; earned: boolean; i: number }) {
  const r = rarityOf(badge.badge_type);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(i * 0.04, 0.5), type: "spring", stiffness: 280, damping: 22 }}
      whileHover={earned ? { y: -4, scale: 1.02 } : { y: -2 }}
      className="relative flex flex-col items-center rounded-2xl border p-4 text-center"
      style={
        earned
          ? { background: r.bg, borderColor: r.border, boxShadow: r.glow }
          : {
              background: "linear-gradient(135deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))",
              borderColor: "rgba(255,255,255,0.07)",
            }
      }
    >
      {/* Kazanıldı işareti */}
      {earned && (
        <span
          className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-extrabold"
          style={{ background: r.chip, color: "#fff", boxShadow: `0 0 10px ${r.border}` }}
        >
          ✓
        </span>
      )}

      {/* İkon küresi */}
      <span
        className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
          earned ? "animate-float" : "opacity-45 grayscale"
        }`}
        style={
          earned
            ? {
                background: "linear-gradient(135deg, rgba(15,10,30,0.55), rgba(30,27,75,0.4))",
                border: `1px solid ${r.border}`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px -6px ${r.border}`,
              }
            : {
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }
        }
      >
        {badgeIcon(badge)}
      </span>

      <p className={`mt-2.5 text-sm font-bold ${earned ? "text-white" : "text-slate-500"}`}>
        {badge.name}
      </p>
      {badge.description && (
        <p className={`mt-1 text-[11px] leading-snug ${earned ? "text-slate-300/85" : "text-slate-600"}`}>
          {badge.description}
        </p>
      )}

      {/* Alt çip: nadirlik ya da kilit gereksinimi */}
      {earned ? (
        <span
          className="mt-2.5 rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest"
          style={{ background: r.chip, color: "#fff" }}
        >
          {r.label}
        </span>
      ) : (
        <span className="mt-2.5 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
          🔒{" "}
          {badge.required_points > 0
            ? `${badge.required_points.toLocaleString("tr-TR")} puan`
            : "Kilitli"}
        </span>
      )}
    </motion.div>
  );
}

export default function BadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("badges")
      .select("*")
      .order("required_points", { ascending: true });
    setBadges((data as Badge[]) ?? []);

    if (user) {
      const { data: earned } = await supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", user.id);
      setEarnedIds(new Set((earned ?? []).map((e) => e.badge_id as string)));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const earned = badges.filter((b) => earnedIds.has(b.id));
  const locked = badges.filter((b) => !earnedIds.has(b.id));
  const pct = badges.length > 0 ? Math.round((earned.length / badges.length) * 100) : 0;

  return (
    <Container className="max-w-2xl">
      <div className="py-4">
        {/* ── BAŞLIK ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-1 flex items-center gap-2.5"
        >
          <motion.span
            animate={{ rotate: [-6, 6, -6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-3xl drop-shadow-[0_2px_10px_rgba(252,211,77,0.5)]"
            aria-hidden
          >
            🏆
          </motion.span>
          <h1 className="lb-title text-3xl font-extrabold tracking-tight">Rozetler</h1>
        </motion.div>
        <p className="mb-5 text-sm text-slate-400">
          Koleksiyonunu tamamla — her rozet bir hikâye.
        </p>

        {/* ── KOLEKSİYON İLERLEMESİ ─────────────────────────────── */}
        {user && !loading && badges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            className="anonix-dark-card relative mb-6 overflow-hidden rounded-3xl border border-amber-400/25 p-5"
            style={{
              background:
                "linear-gradient(135deg, rgba(252,211,77,0.1) 0%, rgba(124,58,237,0.18) 50%, rgba(10,8,22,0.9) 100%)",
              boxShadow: "0 0 40px -12px rgba(252,211,77,0.35)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                  Koleksiyonun
                </p>
                <p className="mt-0.5 text-2xl font-extrabold text-white">
                  {earned.length}
                  <span className="text-base font-bold text-white/50">/{badges.length} rozet</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {pct === 100
                    ? "Hepsini topladın, efsanesin! 🏆"
                    : locked.length > 0
                      ? `Sıradaki hedef: ${locked[0].name}`
                      : ""}
                </p>
              </div>
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <motion.circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke="url(#bp-grad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 27}
                    initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 27 * (1 - pct / 100) }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                  <defs>
                    <linearGradient id="bp-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fcd34d" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute text-sm font-extrabold text-white">%{pct}</span>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : user ? (
          <>
            {/* ── KAZANILANLAR ───────────────────────────────────── */}
            {earned.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-xs">
                    ✓
                  </span>
                  Kazandıkların
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300">
                    {earned.length}
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {earned.map((b, i) => (
                    <BadgeCard key={b.id} badge={b} earned i={i} />
                  ))}
                </div>
              </section>
            )}

            {/* ── KİLİTLİLER ─────────────────────────────────────── */}
            {locked.length > 0 && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-xs">
                    🔒
                  </span>
                  Seni bekleyenler
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-extrabold text-slate-400">
                    {locked.length}
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {locked.map((b, i) => (
                    <BadgeCard key={b.id} badge={b} earned={false} i={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((b, i) => (
              <BadgeCard key={b.id} badge={b} earned={false} i={i} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
