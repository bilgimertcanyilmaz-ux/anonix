"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import type { BannedWord } from "@/types";

const SEVERITIES = ["low", "medium", "high"];
const SEVERITY_TONE: Record<string, string> = {
  low: "bg-white/10 text-slate-300",
  medium: "bg-amber-500/20 text-amber-200",
  high: "bg-red-500/20 text-red-200",
};

export default function AdminBannedWordsPage() {
  const { success, error: toastError } = useToast();
  const [words, setWords] = useState<BannedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [newSeverity, setNewSeverity] = useState("medium");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banned_words")
      .select("*")
      .order("created_at", { ascending: false });
    setWords((data as BannedWord[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addWord(e: FormEvent) {
    e.preventDefault();
    const w = newWord.trim().toLocaleLowerCase("tr-TR");
    if (!w) return;
    setAdding(true);
    const { error } = await supabase.from("banned_words").insert({ word: w, severity: newSeverity });
    setAdding(false);
    if (error) {
      toastError(error.code === "23505" ? "Bu kelime zaten ekli." : "Eklenemedi.");
      return;
    }
    setNewWord("");
    success("Kelime eklendi.");
    load();
  }

  async function toggleActive(w: BannedWord) {
    await supabase.from("banned_words").update({ is_active: !w.is_active }).eq("id", w.id);
    setWords((prev) => prev.map((x) => (x.id === w.id ? { ...x, is_active: !x.is_active } : x)));
  }

  async function remove(w: BannedWord) {
    const { error } = await supabase.from("banned_words").delete().eq("id", w.id);
    if (error) return toastError("Silinemedi.");
    success("Kelime silindi.");
    setWords((prev) => prev.filter((x) => x.id !== w.id));
  }

  return (
    <div>
      {/* Ekleme formu */}
      <form onSubmit={addWord} className="card mb-4 flex flex-wrap items-end gap-2 p-4">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-300">Kelime</label>
          <input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="yasaklı kelime"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300">Şiddet</label>
          <select
            value={newSeverity}
            onChange={(e) => setNewSeverity(e.target.value)}
            className="rounded-xl border border-white/10 bg-ink-900 px-3 py-2 text-sm text-white outline-none focus:border-brand-500/60"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={adding} className="!px-5 !py-2 text-xs">
          {adding ? "..." : "Ekle"}
        </Button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-12 animate-pulse" />
          ))}
        </div>
      ) : words.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">Yasaklı kelime yok.</div>
      ) : (
        <div className="space-y-2">
          {words.map((w) => (
            <div
              key={w.id}
              className={`card flex items-center justify-between gap-2 p-3 ${w.is_active ? "" : "opacity-50"}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{w.word}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${SEVERITY_TONE[w.severity]}`}>
                  {w.severity}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(w)}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
                >
                  {w.is_active ? "Pasifleştir" : "Aktifleştir"}
                </button>
                <button
                  onClick={() => remove(w)}
                  className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-200 hover:bg-red-500/25"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
