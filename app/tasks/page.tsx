"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { mergeTasks, taskIcon } from "@/lib/tasks";
import { TargetIcon } from "@/components/ui/icons";
import type { DailyTask, UserDailyTask, TaskWithProgress } from "@/types";

export default function TasksPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<TaskWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: defs }, { data: progress }] = await Promise.all([
      supabase.from("daily_tasks").select("*").eq("is_active", true).order("reward_points", { ascending: false }),
      supabase
        .from("user_daily_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_date", new Date().toISOString().slice(0, 10)),
    ]);
    setTasks(mergeTasks((defs as DailyTask[]) ?? [], (progress as UserDailyTask[]) ?? []));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  if (authLoading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  const completedCount = tasks.filter((t) => t.is_completed).length;

  return (
    <Container>
      <div className="py-4">
        <div className="mb-1 flex items-center gap-2">
          <TargetIcon className="h-6 w-6 text-brand-300" />
          <h1 className="text-2xl font-extrabold text-white">Bugünkü görevler</h1>
        </div>
        <p className="mb-5 text-sm text-slate-400">
          {completedCount}/{tasks.length} tamamlandı · her gün yenilenir
        </p>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => {
              const pct = Math.min(100, Math.round((t.progress / t.target_count) * 100));
              return (
                <div
                  key={t.id}
                  className={`card p-4 transition-colors ${t.is_completed ? "border-emerald-500/30 bg-emerald-500/[0.06]" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{taskIcon(t.task_type)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{t.title}</p>
                        <span className="shrink-0 rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-bold text-brand-200">
                          +{t.reward_points}
                        </span>
                      </div>
                      {t.description && (
                        <p className="mt-0.5 text-xs text-slate-400">{t.description}</p>
                      )}

                      {/* İlerleme barı */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${t.is_completed ? "bg-emerald-400" : "bg-brand-gradient"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-medium text-slate-400">
                          {Math.min(t.progress, t.target_count)}/{t.target_count}
                        </span>
                      </div>

                      {t.is_completed && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
                          ✓ Tamamlandı
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
