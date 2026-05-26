"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/ToastProvider";
import { timeAgo } from "@/lib/format";
import type { ConfessionRecord, GolgePost } from "@/types";

type PendingItem =
  | { kind: "confession"; data: ConfessionRecord }
  | { kind: "golge"; data: GolgePost };

export default function AdminPendingPage() {
  const { success, error: toastError } = useToast();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: confs }, { data: golge }] = await Promise.all([
      supabase
        .from("confessions")
        .select("*, profiles(username, gender, is_anonymous, avatar_url)")
        .eq("moderation_status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("golge_posts")
        .select("*, profiles(username, gender, is_anonymous, avatar_url)")
        .eq("moderation_status", "pending_review")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    const merged: PendingItem[] = [
      ...((confs as ConfessionRecord[]) ?? []).map((c) => ({ kind: "confession" as const, data: c })),
      ...((golge as GolgePost[]) ?? []).map((g) => ({ kind: "golge" as const, data: g })),
    ];
    setItems(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(kind: "confession" | "golge", id: string, status: string) {
    setBusyId(id);
    const { error } = await supabase.rpc("admin_set_moderation", {
      p_type: kind,
      p_id: id,
      p_status: status,
    });
    setBusyId(null);
    if (error) {
      toastError("İşlem başarısız. Yetkini kontrol et.");
      return;
    }
    success(
      status === "approved" ? "İçerik onaylandı." : status === "rejected" ? "İçerik reddedildi." : "İçerik gizlendi."
    );
    setItems((prev) => prev.filter((it) => it.data.id !== id));
  }

  async function banAuthor(userId: string) {
    setBusyId(userId);
    const { error } = await supabase.rpc("admin_set_ban", {
      target: userId,
      banned: true,
      reason: "İçerik ihlali (acil inceleme)",
    });
    setBusyId(null);
    if (error) toastError("Banlama başarısız.");
    else success("Kullanıcı banlandı.");
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-white">Acil İnceleme</h2>
        <p className="text-xs text-slate-400">
          Şikayetle veya otomatik olarak gizlenmiş, incelenmeyi bekleyen içerikler.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="card h-28 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">
          İncelenmeyi bekleyen içerik yok. 👍
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const id = it.data.id;
            const author = it.data.profiles?.username
              ? `@${it.data.profiles.username}`
              : "Anonim";
            return (
              <div key={id} className="card p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    {it.kind === "confession" ? "İTİRAF" : "GÖLGE"} · İNCELEME
                  </span>
                  <span className="text-xs text-slate-500">{timeAgo(it.data.created_at)}</span>
                </div>

                {it.kind === "confession" ? (
                  <p className="whitespace-pre-wrap text-sm text-slate-200">
                    {(it.data as ConfessionRecord).content}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={(it.data as GolgePost).image_url}
                      alt=""
                      className="max-h-48 rounded-lg object-cover"
                    />
                    {(it.data as GolgePost).overlay_text && (
                      <p className="text-sm text-slate-300">{(it.data as GolgePost).overlay_text}</p>
                    )}
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">Yazar: {author}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatus(it.kind, id, "approved")}
                    disabled={busyId === id}
                    className="rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => setStatus(it.kind, id, "hidden")}
                    disabled={busyId === id}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20 disabled:opacity-60"
                  >
                    Gizle
                  </button>
                  <button
                    onClick={() => setStatus(it.kind, id, "rejected")}
                    disabled={busyId === id}
                    className="rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => banAuthor(it.data.user_id)}
                    disabled={busyId === it.data.user_id}
                    className="ml-auto rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                  >
                    Yazarı banla
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
