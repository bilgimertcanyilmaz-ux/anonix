"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { timeAgo } from "@/lib/format";
import type { PaymentLog } from "@/types";

interface Stats {
  users: number;
  confessions: number;
  golge: number;
  pendingReports: number;
  bannedUsers: number;
  last24h: number;
}

interface PayStats {
  revenue: number;
  plusSubs: number;
  ultraSubs: number;
  mrr: number;
  plusRevenue: number;
  ultraRevenue: number;
  failed: number;
  recent: PaymentLog[];
}

// Aylık fiyatlar (server-side sabit ile uyumlu)
const PLUS_PRICE = 49.99;
const ULTRA_PRICE = 99.99;

async function countOf(table: string, build?: (q: any) => any): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (build) q = build(q);
  const { count } = await q;
  return count ?? 0;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pay, setPay] = useState<PayStats | null>(null);

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
      setStats({ users, confessions, golge, pendingReports, bannedUsers, last24h: conf24 + golge24 });

      // Ödeme istatistikleri — paket bazlı (profiles.subscription_tier)
      const [plusSubs, ultraSubs, failed, successLogs, recent] = await Promise.all([
        countOf("profiles", (q) => q.eq("subscription_tier", "plus")),
        countOf("profiles", (q) => q.eq("subscription_tier", "ultra_plus")),
        countOf("payment_logs", (q) => q.eq("status", "failed")),
        supabase.from("payment_logs").select("amount").eq("status", "success"),
        supabase.from("payment_logs").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      const revenue = ((successLogs.data as { amount: number }[]) ?? []).reduce(
        (s, r) => s + Number(r.amount),
        0
      );
      const plusRevenue = plusSubs * PLUS_PRICE;
      const ultraRevenue = ultraSubs * ULTRA_PRICE;
      setPay({
        revenue,
        plusSubs,
        ultraSubs,
        mrr: plusRevenue + ultraRevenue,
        plusRevenue,
        ultraRevenue,
        failed,
        recent: (recent.data as PaymentLog[]) ?? [],
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

  const payCards = [
    { label: "Aylık MRR", value: pay ? `₺${pay.mrr.toFixed(2)}` : "—", icon: "📈" },
    { label: "Plus aboneler", value: pay?.plusSubs, icon: "⭐" },
    { label: "Ultra Plus aboneler", value: pay?.ultraSubs, icon: "👑" },
    { label: "Plus geliri", value: pay ? `₺${pay.plusRevenue.toFixed(2)}` : "—", icon: "💜" },
    { label: "Ultra Plus geliri", value: pay ? `₺${pay.ultraRevenue.toFixed(2)}` : "—", icon: "🟡" },
    { label: "Toplam gelir", value: pay ? `₺${pay.revenue.toFixed(2)}` : "—", icon: "💰" },
    { label: "Başarısız ödeme", value: pay?.failed, icon: "❌", warn: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`card p-5 ${c.warn && (c.value ?? 0) > 0 ? "border-amber-500/30" : ""}`}>
            <span className="text-2xl">{c.icon}</span>
            <p className="mt-2 text-2xl font-extrabold text-white">{stats ? c.value : "—"}</p>
            <p className="text-xs text-slate-400">{c.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-slate-300">Ödemeler</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {payCards.map((c) => (
            <div key={c.label} className="card p-5">
              <span className="text-2xl">{c.icon}</span>
              <p className="mt-2 text-2xl font-extrabold text-white">{pay ? (c.value ?? 0) : "—"}</p>
              <p className="text-xs text-slate-400">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-bold text-slate-300">Son ödemeler</h2>
        {!pay ? (
          <div className="card h-24 animate-pulse" />
        ) : pay.recent.length === 0 ? (
          <div className="card p-6 text-center text-sm text-slate-400">Henüz ödeme yok.</div>
        ) : (
          <div className="space-y-2">
            {pay.recent.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-2 p-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    ₺{Number(p.amount).toFixed(2)} {p.currency}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.provider} · {timeAgo(p.created_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    p.status === "success"
                      ? "bg-emerald-500/20 text-emerald-200"
                      : p.status === "failed"
                        ? "bg-red-500/20 text-red-200"
                        : "bg-amber-500/20 text-amber-200"
                  }`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
