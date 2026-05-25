"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/ToastProvider";
import type { LaunchChecklistItem } from "@/types";

export default function LaunchChecklistPage() {
  const { error: toastError } = useToast();
  const [items, setItems] = useState<LaunchChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("launch_checklist")
      .select("*")
      .order("category", { ascending: true })
      .order("title", { ascending: true });
    setItems((data as LaunchChecklistItem[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(item: LaunchChecklistItem) {
    const next = !item.is_completed;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: next } : i)));
    const { error } = await supabase
      .from("launch_checklist")
      .update({ is_completed: next, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error) {
      toastError("Güncellenemedi.");
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: !next } : i)));
    }
  }

  async function saveNote(item: LaunchChecklistItem, notes: string) {
    if (notes === (item.notes ?? "")) return;
    await supabase
      .from("launch_checklist")
      .update({ notes, updated_at: new Date().toISOString() })
      .eq("id", item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, notes } : i)));
  }

  const total = items.length;
  const done = items.filter((i) => i.is_completed).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  // Kategoriye göre grupla
  const grouped = items.reduce<Record<string, LaunchChecklistItem[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  return (
    <div>
      {/* İlerleme */}
      <div className="card mb-5 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Canlıya hazırlık</p>
          <p className="text-sm font-bold text-brand-200">%{pct}</p>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? "bg-emerald-400" : "bg-brand-gradient"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {done}/{total} madde tamamlandı{pct === 100 ? " · Canlıya hazır 🚀" : ""}
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, list]) => (
            <div key={category}>
              <h2 className="mb-2 text-sm font-bold text-slate-300">{category}</h2>
              <div className="space-y-2">
                {list.map((item) => (
                  <div
                    key={item.id}
                    className={`card p-4 ${item.is_completed ? "border-emerald-500/30 bg-emerald-500/[0.05]" : ""}`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => toggle(item)}
                        className="mt-0.5 h-5 w-5 shrink-0 accent-brand-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${item.is_completed ? "text-emerald-200 line-through" : "text-white"}`}>
                          {item.title}
                        </span>
                        {item.description && (
                          <span className="mt-0.5 block text-xs text-slate-400">{item.description}</span>
                        )}
                      </span>
                    </label>
                    <input
                      defaultValue={item.notes ?? ""}
                      placeholder="Not ekle..."
                      onBlur={(e) => saveNote(item, e.target.value)}
                      className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 outline-none focus:border-brand-500/60"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
