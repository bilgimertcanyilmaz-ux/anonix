"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { GrowthMetrics, FeedbackReport, FlaggedUser } from "@/types";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-300">{sub}</p>}
    </div>
  );
}

export default function AdminGrowthPage() {
  const [m, setM] = useState<GrowthMetrics | null>(null);
  const [feedback, setFeedback] = useState<FeedbackReport[]>([]);
  const [flagged, setFlagged] = useState<FlaggedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: metrics }, { data: fb }, { data: fl }] = await Promise.all([
        supabase.rpc("admin_growth_metrics"),
        supabase
          .from("feedback_reports")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("flagged_users")
          .select("*, profiles(username, gender)")
          .eq("resolved", false)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setM((metrics as GrowthMetrics) ?? null);
      setFeedback((fb as FeedbackReport[]) ?? []);
      setFlagged((fl as FlaggedUser[]) ?? []);
      setLoading(false);
    })();
  }, []);

  async function resolveFlag(id: string) {
    await supabase.from("flagged_users").update({ resolved: true }).eq("id", id);
    setFlagged((prev) => prev.filter((f) => f.id !== id));
  }

  async function setFeedbackStatus(id: string, status: string) {
    await supabase.from("feedback_reports").update({ status }).eq("id", id);
    setFeedback((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Growth Paneli</h2>
        <p className="text-xs text-slate-400">Aktiflik, elde tutma ve topluluk sağlığı.</p>
      </div>

      {/* Aktiflik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="DAU (24s)" value={m?.dau ?? 0} />
        <StatCard label="WAU (7g)" value={m?.wau ?? 0} />
        <StatCard label="MAU (30g)" value={m?.mau ?? 0} />
        <StatCard
          label="DAU/MAU yapışkanlık"
          value={m && m.mau ? `%${Math.round((m.dau / m.mau) * 100)}` : "—"}
        />
      </div>

      {/* Büyüme */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Toplam kullanıcı" value={m?.total_users ?? 0} />
        <StatCard label="Yeni (24s)" value={m?.new_users_24h ?? 0} />
        <StatCard label="Yeni (7g)" value={m?.new_users_7d ?? 0} />
        <StatCard label="D1 retention" value={`%${m?.d1_retention ?? 0}`} />
      </div>

      {/* Dönüşüm + topluluk */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Plus üye" value={m?.plus_users ?? 0} />
        <StatCard label="Beta kullanıcı" value={m?.beta_users ?? 0} />
        <StatCard
          label="Memnuniyet"
          value={m?.avg_satisfaction != null ? `${m.avg_satisfaction}/5` : "—"}
        />
        <StatCard label="Kurulum oranı" value={`%${m?.install_rate ?? 0}`} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="İtiraf (24s)" value={m?.confessions_24h ?? 0} />
        <StatCard label="Gölge (24s)" value={m?.golge_24h ?? 0} />
        <StatCard label="Açık geri bildirim" value={m?.open_feedback ?? 0} />
        <StatCard label="İşaretli kullanıcı" value={m?.flagged_open ?? 0} />
      </div>

      {/* İşaretlenen kullanıcılar (kötüye kullanım) */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-white">Kötüye kullanım — işaretli kullanıcılar</h3>
        {flagged.length === 0 ? (
          <p className="card p-4 text-xs text-slate-400">Açık işaretleme yok. 🎉</p>
        ) : (
          <div className="space-y-2">
            {flagged.map((f) => (
              <div key={f.id} className="card flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-200">
                    @{f.profiles?.username ?? f.user_id.slice(0, 8)}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {f.reason} · {f.severity}
                  </p>
                </div>
                <button
                  onClick={() => resolveFlag(f.id)}
                  className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:bg-white/5"
                >
                  Çözüldü
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Geri bildirimler */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-white">Son geri bildirimler</h3>
        {feedback.length === 0 ? (
          <p className="card p-4 text-xs text-slate-400">Henüz geri bildirim yok.</p>
        ) : (
          <div className="space-y-2">
            {feedback.map((f) => (
              <div key={f.id} className="card p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold uppercase text-brand-300">
                    {f.kind}
                    {f.rating ? ` · ${f.rating}★` : ""}
                  </span>
                  <select
                    value={f.status}
                    onChange={(e) => setFeedbackStatus(f.id, e.target.value)}
                    className="rounded-md border border-white/10 bg-ink-900 px-2 py-0.5 text-[11px] text-slate-300"
                  >
                    <option value="new">Yeni</option>
                    <option value="reviewing">İnceleniyor</option>
                    <option value="resolved">Çözüldü</option>
                  </select>
                </div>
                {f.message && <p className="text-xs text-slate-300">{f.message}</p>}
                <p className="mt-1 text-[10px] text-slate-500">
                  {f.page ?? "—"} · {new Date(f.created_at).toLocaleString("tr-TR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
