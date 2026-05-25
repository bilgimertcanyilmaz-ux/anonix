import { supabase } from "@/lib/supabaseClient";
import type { DailyTask, UserDailyTask, TaskWithProgress } from "@/types";

/** Görev tipine göre emoji. */
export function taskIcon(taskType: string): string {
  switch (taskType) {
    case "confession":
      return "📝";
    case "comment":
      return "💬";
    case "like":
      return "❤️";
    case "golge":
      return "🌙";
    case "visit_plus":
      return "👑";
    default:
      return "🎯";
  }
}

/**
 * Aktif görevleri kullanıcının bugünkü ilerlemesiyle birleştirir.
 * İlerleme kaydı yoksa 0 kabul edilir.
 */
export function mergeTasks(
  tasks: DailyTask[],
  userTasks: UserDailyTask[]
): TaskWithProgress[] {
  const byTask = new Map(userTasks.map((u) => [u.task_id, u]));
  return tasks.map((t) => {
    const u = byTask.get(t.id);
    return {
      ...t,
      progress: u?.progress ?? 0,
      is_completed: u?.is_completed ?? false,
    };
  });
}

/** İstemci tarafı görev ilerletme (ör. Plus ziyareti). Sessizce başarısız olur. */
export async function bumpMyTask(taskType: string): Promise<void> {
  try {
    await supabase.rpc("bump_my_task", { p_type: taskType });
  } catch {
    // sessiz: görev ilerletme kritik değil
  }
}
