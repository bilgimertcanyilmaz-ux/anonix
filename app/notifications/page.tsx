"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotif } from "@/components/notifications/NotifProvider";
import { notificationIcon, notificationHref } from "@/lib/notifications";
import { timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refresh: refreshBadge } = useNotif();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as Notification[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function markAllRead() {
    if (!user) return;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    refreshBadge();
  }

  async function openNotification(n: Notification) {
    if (!n.is_read && user) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", n.id);
      refreshBadge();
    }
    router.push(notificationHref(n));
  }

  if (authLoading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <Container>
      <div className="py-4">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white">Bildirimler</h1>
          {hasUnread && (
            <button
              onClick={markAllRead}
              className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              Tümünü okundu yap
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-16 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Henüz bildirimin yok"
            description="Beğeniler, yorumlar ve yeni takipçiler burada görünecek."
            actionLabel="İtirafları keşfet"
            actionHref="/confessions"
          />
        ) : (
          <div className="space-y-2">
            {items.map((n) => (
              <button
                key={n.id}
                onClick={() => openNotification(n)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                  n.is_read
                    ? "notif-read border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                    : "border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/15"
                }`}
              >
                <span className="text-xl">{notificationIcon(n.type)}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200">{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="h-2 w-2 shrink-0 rounded-full bg-pink-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
