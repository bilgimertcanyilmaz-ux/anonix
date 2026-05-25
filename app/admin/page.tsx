"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Stats {
  users: number;
  confessions: number;
  golge: number;
  pendingReports: number;
  bannedUsers: number;
  last24h: number;
}

async function countOf(table: string, build?: (q: any) => any): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count } = await q;
  return count ?? 0;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [users, confessions, golge, pendingReports, bannedUsers, conf24, golge24] =
        await Promise.all([
          countOf("profiles"),
          countOf("confessions"),
          countOf("golge_posts"),
          countOf("reports", (q) => q.eq("status", "pending")),
          countOf("profiles", (q) => q.eq("is_banned", true)),
          countOf("confessions", (q) => q.gte("created_at", since)),
          countOf("golge_posts", (q) => q.gte("created_at", since)),
        ]);
      setStats({
        users,
        confessions,
        golge,
        pendingReports,
        bannedUsers,
        last24h: conf24 + golge24,
      });
    })();
  }, []);

  const cards = [
    { label: "Toplam kullanıcı", value: stats?.users, icon: "👥" },
    { label: "Toplam itiraf", value: stats?.confessions, icon: "📝" },
    { label: "Toplam Gölge", value: stats?.golge, icon: "🌙" },
    { label: "Bekleyen şikayet", value: stats?.pendingReports, icon: "🚩", warn: true },
    { label: "Banlı kullanıcı", value: stats?.bannedUsers, icon: "🚫", warn: true },
    { label: "Son 24s içerik", value: stats?.last24h, icon: "⚡" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`card p-5 ${c.warn && (c.value ?? 0) > 0 ? "border-amber-500/30" : ""}`}
        >
          <span className="text-2xl">{c.icon}</span>
          <p className="mt-2 text-2xl font-extrabold text-white">
            {stats ? c.value : "—"}
          </p>
          <p className="text-xs text-slate-400">{c.label}</p>
        </div>
      ))}
    </div>
  );
}
