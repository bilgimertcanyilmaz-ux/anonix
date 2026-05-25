"use client";

import { useEffect, useState, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { badgeIcon, badgeTone } from "@/lib/badges";
import { TrophyIcon } from "@/components/ui/icons";
import type { Badge } from "@/types";

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

  return (
    <Container>
      <div className="py-4">
        <div className="mb-1 flex items-center gap-2">
          <TrophyIcon className="h-6 w-6 text-amber-300" />
          <h1 className="text-2xl font-extrabold text-white">Rozetler</h1>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          {user ? `${earnedIds.size}/${badges.length} rozet kazandın` : "Tüm rozetleri keşfet"}
        </p>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-32 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {badges.map((b) => {
              const earned = earnedIds.has(b.id);
              return (
                <div
                  key={b.id}
                  className={`flex flex-col items-center rounded-2xl border bg-gradient-to-br p-4 text-center transition-all ${
                    earned
                      ? `${badgeTone(b.badge_type)} shadow-glow`
                      : "border-white/5 from-white/[0.02] to-transparent opacity-50 grayscale"
                  }`}
                >
                  <span className={`text-4xl ${earned ? "animate-float" : ""}`}>
                    {badgeIcon(b)}
                  </span>
                  <p className="mt-2 text-sm font-bold text-white">{b.name}</p>
                  {b.description && (
                    <p className="mt-1 text-[11px] leading-snug text-slate-400">{b.description}</p>
                  )}
                  {!earned && (
                    <span className="mt-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      Kilitli
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
