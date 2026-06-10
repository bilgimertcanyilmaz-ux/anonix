"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { rankIcon } from "@/lib/ranks";
import { getSubscriptionTier } from "@/lib/subscription";
import type { Profile } from "@/types";

type Board = "points" | "streak";

/** Podyum (ilk 3) renk/efekt ayarları — altın, gümüş, bronz. */
const PODIUM = [
  {
    medal: "🥇",
    ring: "#fbbf24",
    border: "rgba(252,211,77,0.55)",
    glow: "0 0 36px -8px rgba(252,211,77,0.55)",
    chip: "linear-gradient(135deg, #fde68a, #f59e0b)",
  },
  {
    medal: "🥈",
    ring: "#cbd5e1",
    border: "rgba(203,213,225,0.45)",
    glow: "0 0 28px -8px rgba(203,213,225,0.4)",
    chip: "linear-gradient(135deg, #f1f5f9, #94a3b8)",
  },
  {
    medal: "🥉",
    ring: "#fb923c",
    border: "rgba(251,146,60,0.45)",
    glow: "0 0 28px -8px rgba(251,146,60,0.4)",
    chip: "linear-gradient(135deg, #fdba74, #ea580c)",
  },
];

function boardValue(p: Profile, board: Board): number {
  return board === "points" ? (p.points ?? 0) : (p.longest_streak ?? 0);
}

function formatValue(p: Profile, board: Board): string {
  return board === "points"
    ? `${(p.points ?? 0).toLocaleString("tr-TR")}`
    : `${p.longest_streak ?? 0}`;
}

/** Avatar — görsel varsa onu, yoksa baş harfli gradyan daire. */
function BoardAvatar({ p, size }: { p: Profile; size: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-brand-500 to-accent-500"
      style={{ width: size, height: size }}
    >
      {p.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center font-extrabold text-white"
          style={{ fontSize: size * 0.42 }}
        >
          {p.username?.[0]?.toUpperCase() ?? "A"}
        </div>
      )}
    </div>
  );
}

/** Üyelik çipi — Ultra Plus altın, Plus mor. */
function TierChip({ p }: { p: Profile }) {
  const tier = getSubscriptionTier(p as never);
  if (tier === "ultra_plus")
    return (
      <span className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-ink-900">
        Ultra
      </span>
    );
  if (tier === "plus")
    return (
      <span className="shrink-0 rounded-full bg-brand-500/25 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wide text-brand-200 ring-1 ring-inset ring-brand-400/40">
        Plus
      </span>
    );
  return null;
}

/** Podyum kartı — 1. sıra daha yüksek ve taçlı. */
function PodiumCard({
  p,
  place,
  board,
  isMe,
}: {
  p: Profile;
  place: 0 | 1 | 2;
  board: Board;
  isMe: boolean;
}) {
  const cfg = PODIUM[place];
  const first = place === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22, delay: 0.1 + place * 0.08 }}
      className={`card relative flex flex-col items-center gap-1.5 px-2 pb-3 text-center ${
        first ? "pt-7" : "pt-4"
      }`}
      style={{ borderColor: cfg.border, boxShadow: cfg.glow }}
    >
      {/* Taç (yalnızca 1.) */}
      {first && (
        <motion.span
          aria-hidden
          animate={{ y: [0, -3, 0], rotate: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-4 text-2xl drop-shadow-[0_2px_8px_rgba(252,211,77,0.6)]"
        >
          👑
        </motion.span>
      )}

      {/* Avatar + madalya rozeti */}
      <div className="relative">
        <div
          className="rounded-full p-[2.5px]"
          style={{ background: cfg.chip, boxShadow: `0 0 18px -4px ${cfg.ring}` }}
        >
          <div className="rounded-full bg-ink-950 p-[2px]">
            <BoardAvatar p={p} size={first ? 64 : 52} />
          </div>
        </div>
        <span
          className="absolute -bottom-1.5 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-[11px] font-extrabold text-ink-900 shadow-md"
          style={{ background: cfg.chip }}
        >
          {place + 1}
        </span>
      </div>

      <div className="mt-2 flex w-full min-w-0 items-center justify-center gap-1">
        <span className="truncate text-xs font-bold text-white sm:text-sm">@{p.username}</span>
        <TierChip p={p} />
      </div>
      <p className="truncate text-[10px] text-slate-500">
        {rankIcon(p.rank)} {p.rank}
      </p>
      <p className={`lb-val-${place} text-sm font-extrabold sm:text-base`}>
        {formatValue(p, board)}
        <span className="text-[10px] font-semibold"> {board === "points" ? "puan" : "gün 🔥"}</span>
      </p>
      {isMe && (
        <span className="rounded-full bg-brand-500/25 px-2 py-px text-[9px] font-extrabold uppercase tracking-wider text-brand-200">
          Sen
        </span>
      )}
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState<Board>("points");
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const col = board === "points" ? "points" : "longest_streak";
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, username, points, rank, longest_streak, is_plus, subscription_tier, role, avatar_url"
      )
      .order(col, { ascending: false })
      .limit(50);
    setRows((data as Profile[]) ?? []);
    setLoading(false);
  }, [board]);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const maxVal = rows.length ? Math.max(1, boardValue(rows[0], board)) : 1;

  return (
    <Container className="max-w-2xl">
      <div className="py-4">
        {/* Başlık */}
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
          <h1 className="lb-title text-3xl font-extrabold tracking-tight">
            Liderlik Tablosu
          </h1>
        </motion.div>
        <p className="mb-5 text-sm text-slate-400">Topluluğun en aktifleri — zirve senin olsun.</p>

        {/* Sekme — segment kontrol */}
        <div className="mb-6 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
          {([["points", "⭐ Puan"], ["streak", "🔥 Streak"]] as [Board, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setBoard(v)}
              className={`relative rounded-full px-5 py-1.5 text-xs font-bold transition-colors ${
                board === v ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {board === v && (
                <motion.span
                  layoutId="board-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 shadow-glow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative">{l}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <>
            {/* Podyum iskeleti */}
            <div className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-3">
              <div className="card h-36 animate-pulse" />
              <div className="card h-44 animate-pulse" />
              <div className="card h-36 animate-pulse" />
            </div>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="card h-14 animate-pulse" />
              ))}
            </div>
          </>
        ) : (
          <>
            {/* ── PODYUM (ilk 3) — sıralama: 2 | 1 | 3 ─────────────── */}
            {top3.length === 3 && (
              <div className="mb-6 grid grid-cols-3 items-end gap-2 sm:gap-3">
                <PodiumCard p={top3[1]} place={1} board={board} isMe={top3[1].id === user?.id} />
                <PodiumCard p={top3[0]} place={0} board={board} isMe={top3[0].id === user?.id} />
                <PodiumCard p={top3[2]} place={2} board={board} isMe={top3[2].id === user?.id} />
              </div>
            )}

            {/* ── LİSTE (4+) ────────────────────────────────────────── */}
            <div className="space-y-2">
              {(top3.length === 3 ? rest : rows).map((p, i) => {
                const place = top3.length === 3 ? i + 4 : i + 1;
                const isMe = p.id === user?.id;
                const pct = Math.max(4, Math.round((boardValue(p, board) / maxVal) * 100));
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.025, 0.4) }}
                    className={`card card-hover relative flex items-center gap-3 overflow-hidden p-3 ${
                      isMe ? "border-brand-500/60 shadow-glow-sm" : ""
                    }`}
                  >
                    {/* Sıra numarası */}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-extrabold text-slate-400">
                      {place}
                    </span>

                    <BoardAvatar p={p} size={34} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-white">
                          @{p.username}
                        </span>
                        <TierChip p={p} />
                        {isMe && (
                          <span className="shrink-0 rounded-full bg-brand-500/25 px-1.5 py-px text-[9px] font-extrabold uppercase tracking-wider text-brand-200">
                            Sen
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {rankIcon(p.rank)} {p.rank}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-brand-200">
                      {formatValue(p, board)}
                      <span className="ml-1 text-[10px] font-medium text-slate-500">
                        {board === "points" ? "puan" : "gün"}
                      </span>
                    </span>

                    {/* Göreli puan çubuğu */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-brand-500/70 to-accent-500/40"
                      style={{ width: `${pct}%` }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Container>
  );
}
