"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/ToastProvider";
import { timeAgo } from "@/lib/format";

type FeedbackRow = {
  id: string;
  user_id: string | null;
  kind: string;
  rating: number | null;
  message: string | null;
  page: string | null;
  status: string;
  created_at: string;
  meta: {
    user_email?: string | null;
    user_agent?: string | null;
    ip?: string | null;
    admin_reply?: string | null;
    replied_at?: string | null;
  } | null;
};

const KIND_META: Record<string, { icon: string; label: string }> = {
  feedback: { icon: "💬", label: "Genel" },
  bug: { icon: "🐞", label: "Hata" },
  idea: { icon: "💡", label: "Fikir" },
  satisfaction: { icon: "⭐", label: "Memnuniyet" },
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  new: { label: "Yeni", cls: "border-sky-400/40 bg-sky-500/10 text-sky-300" },
  reviewing: { label: "İnceleniyor", cls: "border-amber-400/40 bg-amber-500/10 text-amber-300" },
  resolved: { label: "Çözüldü", cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" },
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "new", label: "Yeni" },
  { key: "reviewing", label: "İnceleniyor" },
  { key: "resolved", label: "Çözüldü" },
];

function FeedbackCard({
  row,
  onChanged,
}: {
  row: FeedbackRow;
  onChanged: () => void;
}) {
  const { success, error: toastErr } = useToast();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const km = KIND_META[row.kind] ?? { icon: "🔔", label: row.kind };
  const sm = STATUS_META[row.status] ?? { label: row.status, cls: "border-white/15 bg-white/5 text-slate-300" };
  const anonymous = !row.user_id;

  async function setStatus(status: string) {
    setBusy(true);
    const { error } = await supabase.from("feedback_reports").update({ status }).eq("id", row.id);
    setBusy(false);
    if (error) toastErr("Durum güncellenemedi.");
    else {
      success("Durum güncellendi.");
      onChanged();
    }
  }

  async function sendReply() {
    const msg = reply.trim();
    if (msg.length < 2) {
      toastErr("Mesaj çok kısa.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("admin_reply_feedback", {
      p_feedback: row.id,
      p_message: msg,
    });
    setBusy(false);
    if (error) {
      toastErr(error.message || "Bildirim gönderilemedi.");
      return;
    }
    success("Bildirim kullanıcıya gönderildi 📣");
    setReply("");
    onChanged();
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg">{km.icon}</span>
        <span className="text-sm font-bold text-white">{km.label}</span>
        {typeof row.rating === "number" && (
          <span className="text-xs text-amber-300">{"★".repeat(row.rating)}{"☆".repeat(5 - row.rating)}</span>
        )}
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sm.cls}`}>{sm.label}</span>
        <span className="ml-auto text-xs text-slate-500">{timeAgo(row.created_at)}</span>
      </div>

      {row.message && <p className="whitespace-pre-wrap text-sm text-slate-200">{row.message}</p>}

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span>👤 {anonymous ? "Anonim" : row.meta?.user_email || row.user_id?.slice(0, 8)}</span>
        {row.page && <span>📄 {row.page}</span>}
      </div>

      {row.meta?.admin_reply && (
        <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] p-2.5 text-xs text-emerald-200">
          <span className="font-semibold">Gönderilen yanıt:</span> {row.meta.admin_reply}
        </div>
      )}

      {/* Durum hızlı butonları */}
      <div className="flex flex-wrap gap-2">
        {(["new", "reviewing", "resolved"] as const).map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy || row.status === s}
            onClick={() => setStatus(s)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold text-slate-300 transition-colors hover:bg-white/[0.07] disabled:opacity-40"
          >
            {STATUS_META[s].label}
          </button>
        ))}
      </div>

      {/* Yanıt gönder */}
      {anonymous ? (
        <p className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-[11px] text-slate-500">
          Bu geri bildirim anonim — kullanıcıya bildirim gönderilemez.
        </p>
      ) : (
        <div className="space-y-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Kullanıcıya bildirim olarak gönderilecek yanıt (örn. Sorun çözüldü, teşekkürler!)"
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
          />
          <button
            type="button"
            disabled={busy || reply.trim().length < 2}
            onClick={sendReply}
            className="rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2 text-xs font-bold text-white shadow-glow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            {busy ? "Gönderiliyor..." : "📣 Bildirim gönder & çözüldü işaretle"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("feedback_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setRows((data as FeedbackRow[]) ?? []);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-white">Geri Bildirimler</h2>
        <button
          onClick={load}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/[0.07]"
        >
          ↻ Yenile
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              filter === f.key
                ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Bu filtrede geri bildirim yok.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <FeedbackCard key={r.id} row={r} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
