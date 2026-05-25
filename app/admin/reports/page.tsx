"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { timeAgo } from "@/lib/format";
import type { Report } from "@/types";

const ENTITY_TABLE: Record<string, string> = {
  confession: "confessions",
  confession_comment: "confession_comments",
  golge: "golge_posts",
  golge_comment: "golge_comments",
};

function contentHref(r: Report): string | null {
  if (r.entity_type === "confession") return `/confessions/${r.entity_id}`;
  if (r.entity_type === "golge") return `/golge/${r.entity_id}`;
  return null; // yorumların doğrudan linki yok
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  resolved: "Çözüldü",
  rejected: "Reddedildi",
};

export default function AdminReportsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyPending, setOnlyPending] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
    if (onlyPending) q = q.eq("status", "pending");
    const { data } = await q;
    setReports((data as Report[]) ?? []);
    setLoading(false);
  }, [onlyPending]);

  useEffect(() => {
    load();
  }, [load]);

  async function logAction(r: Report, action: string, reason?: string) {
    if (!user) return;
    await supabase.from("moderation_logs").insert({
      admin_id: user.id,
      target_user_id: r.reported_user_id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      action,
      reason: reason ?? null,
    });
  }

  async function setStatus(r: Report, status: string) {
    if (!user) return;
    setBusyId(r.id);
    const { error } = await supabase
      .from("reports")
      .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq("id", r.id);
    setBusyId(null);
    if (error) return toastError("Güncellenemedi.");
    success(status === "resolved" ? "Şikayet çözüldü olarak işaretlendi." : "Şikayet reddedildi.");
    load();
  }

  async function deleteContent(r: Report) {
    const table = ENTITY_TABLE[r.entity_type];
    if (!table) return;
    setBusyId(r.id);
    const { error } = await supabase.from(table).delete().eq("id", r.entity_id);
    if (!error) {
      await logAction(r, "delete_content", r.reason);
      await supabase
        .from("reports")
        .update({ status: "resolved", reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
        .eq("id", r.id);
    }
    setBusyId(null);
    if (error) return toastError("İçerik silinemedi.");
    success("İçerik silindi ve şikayet çözüldü.");
    load();
  }

  async function banUser(r: Report) {
    if (!r.reported_user_id) return;
    setBusyId(r.id);
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: true, banned_reason: `Şikayet: ${r.reason}` })
      .eq("id", r.reported_user_id);
    if (!error) {
      await logAction(r, "ban_user", r.reason);
      await supabase
        .from("reports")
        .update({ status: "resolved", reviewed_at: new Date().toISOString(), reviewed_by: user!.id })
        .eq("id", r.id);
    }
    setBusyId(null);
    if (error) return toastError("Kullanıcı banlanamadı.");
    success("Kullanıcı banlandı ve şikayet çözüldü.");
    load();
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => setOnlyPending(true)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${onlyPending ? "bg-brand-500/15 text-brand-100" : "bg-white/5 text-slate-400"}`}
        >
          Bekleyenler
        </button>
        <button
          onClick={() => setOnlyPending(false)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!onlyPending ? "bg-brand-500/15 text-brand-100" : "bg-white/5 text-slate-400"}`}
        >
          Tümü
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Şikayet yok.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const href = contentHref(r);
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">{r.reason}</p>
                    <p className="text-xs text-slate-400">
                      {r.entity_type} · {timeAgo(r.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.status === "pending"
                        ? "bg-amber-500/20 text-amber-200"
                        : r.status === "resolved"
                          ? "bg-emerald-500/20 text-emerald-200"
                          : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>

                {r.description && (
                  <p className="mt-2 rounded-lg bg-white/[0.03] p-2 text-xs text-slate-300">
                    “{r.description}”
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {href && (
                    <Link
                      href={href}
                      className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                    >
                      İçeriğe git
                    </Link>
                  )}
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => deleteContent(r)}
                        disabled={busyId === r.id}
                        className="rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-50"
                      >
                        İçeriği sil
                      </button>
                      <button
                        onClick={() => banUser(r)}
                        disabled={busyId === r.id || !r.reported_user_id}
                        className="rounded-full bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25 disabled:opacity-50"
                      >
                        Kullanıcıyı banla
                      </button>
                      <button
                        onClick={() => setStatus(r, "resolved")}
                        disabled={busyId === r.id}
                        className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        Çözüldü
                      </button>
                      <button
                        onClick={() => setStatus(r, "rejected")}
                        disabled={busyId === r.id}
                        className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-50"
                      >
                        Reddet
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
