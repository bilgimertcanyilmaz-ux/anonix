"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { timeAgo } from "@/lib/format";
import type { ModerationLog } from "@/types";

const ACTION_LABEL: Record<string, string> = {
  delete_content: "İçerik silindi",
  ban_user: "Kullanıcı banlandı",
  unban_user: "Ban kaldırıldı",
  role_admin: "Admin yapıldı",
  role_user: "Admin kaldırıldı",
};

export default function AdminModerationPage() {
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("moderation_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs((data as ModerationLog[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-14 animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="card p-8 text-center text-sm text-slate-400">
          Henüz moderasyon kaydı yok.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="card flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {ACTION_LABEL[l.action] ?? l.action}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {l.entity_type ? `${l.entity_type} · ` : ""}
                  {l.reason ?? ""}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">{timeAgo(l.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
