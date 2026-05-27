"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { clearFlagCache } from "@/lib/features";
import type { FeatureFlag, InviteCode } from "@/types";

export default function AdminBetaPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);

  // Yeni kod formu
  const [newCode, setNewCode] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newMax, setNewMax] = useState(25);

  const load = useCallback(async () => {
    const [{ data: ff }, { data: ic }] = await Promise.all([
      supabase.from("feature_flags").select("*").order("key"),
      supabase.from("invite_codes").select("*").order("created_at", { ascending: false }),
    ]);
    setFlags((ff as FeatureFlag[]) ?? []);
    setCodes((ic as InviteCode[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleFlag(key: string, enabled: boolean) {
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("key", key);
    clearFlagCache();
    if (error) {
      toast.error("Güncellenemedi.");
      return;
    }
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
    toast.success(`${key} ${enabled ? "açıldı" : "kapatıldı"}`);
  }

  async function createCode(e: FormEvent) {
    e.preventDefault();
    const code = newCode.trim().toUpperCase();
    if (code.length < 3) {
      toast.error("Kod en az 3 karakter olmalı.");
      return;
    }
    const { error } = await supabase.from("invite_codes").insert({
      code,
      label: newLabel.trim() || null,
      max_uses: Number.isFinite(newMax) ? newMax : 0,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Bu kod zaten var." : "Eklenemedi.");
      return;
    }
    setNewCode("");
    setNewLabel("");
    toast.success("Davet kodu oluşturuldu.");
    load();
  }

  async function toggleCode(id: string, isActive: boolean) {
    await supabase.from("invite_codes").update({ is_active: isActive }).eq("id", id);
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: isActive } : c)));
  }

  if (loading) {
    return <div className="card h-40 animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-white">Beta & Özellik Yönetimi</h2>
        <p className="text-xs text-slate-400">
          Soft launch kontrolü: davetle kayıt, özellik bayrakları, davet kodları.
        </p>
      </div>

      {/* Özellik bayrakları */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-white">Özellik bayrakları</h3>
        <div className="space-y-2">
          {flags.map((f) => (
            <div key={f.key} className="card flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{f.key}</p>
                <p className="truncate text-[11px] text-slate-400">{f.description}</p>
              </div>
              <button
                onClick={() => toggleFlag(f.key, !f.enabled)}
                aria-label={`${f.key} aç/kapat`}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  f.enabled ? "bg-brand-500" : "bg-white/15"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    f.enabled ? "translate-x-[22px]" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          <code className="text-brand-300">beta_mode</code> açıkken kayıt yalnızca geçerli davet
          kodu ile yapılabilir.
        </p>
      </section>

      {/* Davet kodu oluştur */}
      <section>
        <h3 className="mb-2 text-sm font-bold text-white">Davet kodları</h3>
        <form onSubmit={createCode} className="card mb-3 grid gap-2 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="KOD (ör. ANONIX-W1)"
            className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
          />
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Etiket (ör. TikTok dalga 1)"
            className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
          />
          <input
            type="number"
            min={0}
            value={newMax}
            onChange={(e) => setNewMax(parseInt(e.target.value, 10))}
            title="Max kullanım (0 = sınırsız)"
            className="w-24 rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500/60"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Ekle
          </button>
        </form>

        {codes.length === 0 ? (
          <p className="card p-4 text-xs text-slate-400">Henüz davet kodu yok.</p>
        ) : (
          <div className="space-y-2">
            {codes.map((c) => (
              <div key={c.id} className="card flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm font-bold text-brand-200">{c.code}</p>
                  <p className="text-[11px] text-slate-400">
                    {c.label ? `${c.label} · ` : ""}
                    {c.used_count}/{c.max_uses === 0 ? "∞" : c.max_uses} kullanım
                  </p>
                </div>
                <button
                  onClick={() => toggleCode(c.id, !c.is_active)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                    c.is_active
                      ? "border-emerald-500/40 text-emerald-300"
                      : "border-white/10 text-slate-400"
                  }`}
                >
                  {c.is_active ? "Aktif" : "Pasif"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
