"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Stats {
  totalUsers: number;
  plusUsers: number;
  streakUsers: number;
  referrals: number;
  events: Record<string, number>;
  topMoods: { mood: string; weight: number }[];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-300">{sub}</p>}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const head = { count: "exact" as const, head: true };
      const [
        { count: totalUsers },
        { count: plusUsers },
        { count: streakUsers },
        { count: referrals },
        { data: events },
        { data: inter },
      ] = await Promise.all([
        supabase.from("profiles").select("id", head),
        supabase.from("profiles").select("id", head).eq("is_plus", true),
        supabase.from("profiles").select("id", head).gt("streak_count", 0),
        supabase.from("referrals").select("id", head),
        supabase.from("analytics_events").select("event").limit(2000),
        supabase.from("user_interactions").select("mood_tag, weight").not("mood_tag", "is", null).limit(2000),
      ]);

      const eventCounts: Record<string, number> = {};
      (events ?? []).forEach((e) => {
        const k = (e as { event: string }).event;
        eventCounts[k] = (eventCounts[k] ?? 0) + 1;
      });

      const moodW: Record<string, number> = {};
      (inter ?? []).forEach((r) => {
        const m = (r as { mood_tag: string }).mood_tag;
        moodW[m] = (moodW[m] ?? 0) + ((r as { weight: number }).weight ?? 1);
      });
      const topMoods = Object.entries(moodW)
        .map(([mood, weight]) => ({ mood, weight }))
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 5);

      setStats({
        totalUsers: totalUsers ?? 0,
        plusUsers: plusUsers ?? 0,
        streakUsers: streakUsers ?? 0,
        referrals: referrals ?? 0,
        events: eventCounts,
        topMoods,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  const plusRate = stats.totalUsers ? Math.round((stats.plusUsers / stats.totalUsers) * 100) : 0;
  const referralRate = stats.totalUsers ? Math.round((stats.referrals / stats.totalUsers) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Toplam kullanıcı" value={stats.totalUsers} />
        <StatCard label="Plus üye" value={stats.plusUsers} sub={`%${plusRate} dönüşüm`} />
        <StatCard label="Streak'li kullanıcı" value={stats.streakUsers} />
        <StatCard label="Davet" value={stats.referrals} sub={`%${referralRate} oran`} />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-bold text-white">En popüler mood etiketleri</h2>
        {stats.topMoods.length === 0 ? (
          <p className="card p-4 text-xs text-slate-400">Henüz etkileşim verisi yok.</p>
        ) : (
          <div className="space-y-2">
            {stats.topMoods.map((m) => (
              <div key={m.mood} className="card flex items-center justify-between p-3">
                <span className="text-sm text-slate-200">{m.mood}</span>
                <span className="text-xs font-bold text-brand-300">{m.weight}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-white">Growth olayları</h2>
        {Object.keys(stats.events).length === 0 ? (
          <p className="card p-4 text-xs text-slate-400">Henüz analytics olayı yok.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(stats.events).map(([ev, n]) => (
              <div key={ev} className="card flex items-center justify-between p-3">
                <span className="truncate text-xs text-slate-300">{ev}</span>
                <span className="text-sm font-bold text-white">{n}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
