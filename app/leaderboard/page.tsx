"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { rankIcon } from "@/lib/ranks";
import { TrophyIcon } from "@/components/ui/icons";
import type { Profile } from "@/types";

type Board = "points" | "streak";

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [board, setBoard] = useState<Board>("points");
  const [rows, setRows] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const col = board === "points" ? "points" : "longest_streak";
    const { data } = await supabase
      .from("profiles")
      .select("id, username, points, rank, longest_streak, is_plus")
      .order(col, { ascending: false })
      .limit(50);
    setRows((data as Profile[]) ?? []);
    setLoading(false);
  }, [board]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Container>
      <div className="py-4">
        <div className="mb-1 flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-amber-300" />
          <h1 className="text-2xl font-extrabold text-white">Liderlik Tablosu</h1>
        </div>
        <p className="mb-5 text-sm text-slate-400">Topluluğun en aktifleri.</p>

        <div className="mb-4 flex gap-2">
          {([["points", "Puan"], ["streak", "Streak 🔥"]] as [Board, string][]).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setBoard(v)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                board === v
                  ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="card h-14 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
                className={`card flex items-center gap-3 p-3 ${i < 3 ? "border-amber-400/30" : ""}`}
              >
                <span className="w-8 shrink-0 text-center text-lg font-bold text-slate-300">
                  {medals[i] ?? i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">@{p.username}</span>
                    {p.is_plus && (
                      <span className="rounded-full bg-amber-400/20 px-1.5 text-[10px] font-bold text-amber-200">PLUS</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {rankIcon(p.rank)} {p.rank}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-brand-200">
                  {board === "points"
                    ? `${p.points.toLocaleString("tr-TR")} puan`
                    : `${p.longest_streak} gün`}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
