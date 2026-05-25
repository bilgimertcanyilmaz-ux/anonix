"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { genderLabel } from "@/lib/profile";
import type { Profile } from "@/types";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("profiles").select("*").order("points", { ascending: false }).limit(100);
    if (search.trim()) q = q.ilike("username", `%${search.trim()}%`);
    const { data } = await q;
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  async function logAction(target: Profile, action: string) {
    if (!user) return;
    await supabase.from("moderation_logs").insert({
      admin_id: user.id,
      target_user_id: target.id,
      action,
    });
  }

  async function toggleBan(p: Profile) {
    setBusyId(p.id);
    const next = !p.is_banned;
    const { error } = await supabase
      .from("profiles")
      .update({ is_banned: next, banned_reason: next ? "Admin tarafından banlandı" : null })
      .eq("id", p.id);
    setBusyId(null);
    if (error) return toastError("İşlem başarısız.");
    await logAction(p, next ? "ban_user" : "unban_user");
    success(next ? "Kullanıcı banlandı." : "Ban kaldırıldı.");
    setUsers((prev) => prev.map((u) => (u.id === p.id ? { ...u, is_banned: next } : u)));
  }

  async function toggleRole(p: Profile) {
    setBusyId(p.id);
    const next = p.role === "admin" ? "user" : "admin";
    const { error } = await supabase.from("profiles").update({ role: next }).eq("id", p.id);
    setBusyId(null);
    if (error) return toastError("Rol değiştirilemedi.");
    await logAction(p, `role_${next}`);
    success(`Rol "${next}" yapıldı.`);
    setUsers((prev) => prev.map((u) => (u.id === p.id ? { ...u, role: next } : u)));
  }

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Kullanıcı adı ara..."
        className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
      />

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Kullanıcı bulunamadı.</div>
      ) : (
        <div className="space-y-2">
          {users.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">@{p.username}</span>
                    {p.role === "admin" && (
                      <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-200">
                        ADMIN
                      </span>
                    )}
                    {p.is_plus && (
                      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                        PLUS
                      </span>
                    )}
                    {p.is_banned && (
                      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-200">
                        BANLI
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {genderLabel[p.gender]} · {p.rank} · {p.points.toLocaleString("tr-TR")} puan
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => toggleBan(p)}
                  disabled={busyId === p.id}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                    p.is_banned
                      ? "bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25"
                      : "bg-red-500/15 text-red-200 hover:bg-red-500/25"
                  }`}
                >
                  {p.is_banned ? "Ban kaldır" : "Banla"}
                </button>
                <button
                  onClick={() => toggleRole(p)}
                  disabled={busyId === p.id || p.id === user?.id}
                  className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50"
                >
                  {p.role === "admin" ? "Admin'i kaldır" : "Admin yap"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
