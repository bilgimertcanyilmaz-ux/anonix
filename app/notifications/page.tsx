"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotif } from "@/components/notifications/NotifProvider";
import { notificationIcon, notificationHref } from "@/lib/notifications";
import { timeAgo } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Notification } from "@/types";

/** Bildirim tipine göre ikon balonu renkleri. */
function typeTone(type: string): { bg: string; ring: string } {
  switch (type) {
    case "confession_like":
    case "golge_like":
    case "comment_like":
      return { bg: "rgba(236,72,153,0.15)", ring: "rgba(236,72,153,0.35)" };
    case "confession_comment":
    case "golge_comment":
      return { bg: "rgba(59,130,246,0.15)", ring: "rgba(59,130,246,0.35)" };
    case "message":
      return { bg: "rgba(99,102,241,0.15)", ring: "rgba(99,102,241,0.35)" };
    case "follow":
      return { bg: "rgba(16,185,129,0.15)", ring: "rgba(16,185,129,0.35)" };
    case "badge":
      return { bg: "rgba(252,211,77,0.15)", ring: "rgba(252,211,77,0.4)" };
    case "task_completed":
      return { bg: "rgba(168,85,247,0.18)", ring: "rgba(168,85,247,0.4)" };
    case "admin_reply":
      return { bg: "rgba(249,115,22,0.15)", ring: "rgba(249,115,22,0.35)" };
    default:
      return { bg: "rgba(148,163,184,0.12)", ring: "rgba(148,163,184,0.3)" };
  }
}

/** Bildirimi tarihe göre gruba ayır. */
function dateGroup(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays <= 0) return "Bugün";
  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return "Bu hafta";
  return "Daha önce";
}

const GROUP_ORDER = ["Bugün", "Dün", "Bu hafta", "Daha önce"];

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { refresh: refreshBadge } = useNotif();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

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
      <Container className="max-w-2xl">
        <div className="space-y-3 py-6">
          <div className="h-8 w-44 animate-pulse rounded-full bg-white/10" />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      </Container>
    );
  }

  const unreadCount = items.filter((n) => !n.is_read).length;
  const shown = filter === "unread" ? items.filter((n) => !n.is_read) : items;

  // Tarihe göre grupla (gösterilen sıra korunur)
  const groups = GROUP_ORDER.map((g) => ({
    label: g,
    rows: shown.filter((n) => dateGroup(n.created_at) === g),
  })).filter((g) => g.rows.length > 0);

  return (
    <Container className="max-w-2xl">
      <div className="py-4">
        {/* ── BAŞLIK ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between gap-3"
        >
          <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight">
            <motion.span
              aria-hidden
              animate={unreadCount > 0 ? { rotate: [0, -12, 10, -8, 6, 0] } : {}}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 4 }}
              className="text-2xl drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]"
            >
              🔔
            </motion.span>
            <span
              className="hero-title"
              style={{
                background: "linear-gradient(135deg, #fff 0%, #e9d5ff 50%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 14px rgba(168,85,247,0.3))",
              }}
            >
              Bildirimler
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-gradient-to-r from-pink-500 to-brand-500 px-2.5 py-1 text-xs font-extrabold text-white shadow-glow-sm">
                {unreadCount}
              </span>
            )}
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="shrink-0 rounded-full bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              ✓✓ Tümünü oku
            </button>
          )}
        </motion.div>

        {/* ── FİLTRE SEGMENTİ ───────────────────────────────────── */}
        <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
          {([
            { key: "all" as const, label: `Tümü (${items.length})` },
            { key: "unread" as const, label: `Okunmamış (${unreadCount})` },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`relative rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                filter === f.key ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {filter === f.key && (
                <motion.span
                  layoutId="notif-filter-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 shadow-glow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative">{f.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="card h-16 animate-pulse" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          filter === "unread" ? (
            <EmptyState
              icon="✅"
              title="Hepsi okundu"
              description="Okunmamış bildirimin yok — temiz iş!"
            />
          ) : (
            <EmptyState
              icon="🔔"
              title="Henüz bildirimin yok"
              description="Beğeniler, yorumlar ve yeni takipçiler burada görünecek."
              actionLabel="İtirafları keşfet"
              actionHref="/confessions"
            />
          )
        ) : (
          <div className="space-y-5">
            {groups.map((g) => (
              <section key={g.label}>
                <h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  {g.label}
                </h2>
                <div className="space-y-2">
                  {g.rows.map((n, i) => {
                    const tone = typeTone(n.type);
                    return (
                      <motion.button
                        key={n.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.03, 0.3) }}
                        onClick={() => openNotification(n)}
                        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 ${
                          n.is_read
                            ? "notif-read border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                            : "border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/15"
                        }`}
                      >
                        {/* Okunmamışta sol vurgu çizgisi */}
                        {!n.is_read && (
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-pink-500 to-brand-500"
                          />
                        )}

                        {/* Tip-renkli ikon balonu */}
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                          style={{
                            background: tone.bg,
                            boxShadow: `inset 0 0 0 1px ${tone.ring}`,
                          }}
                        >
                          {notificationIcon(n.type)}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm leading-snug ${
                              n.is_read ? "text-slate-300" : "font-semibold text-white"
                            }`}
                          >
                            {n.message}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">{timeAgo(n.created_at)}</p>
                        </div>

                        {!n.is_read ? (
                          <motion.span
                            animate={{ scale: [1, 1.25, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity }}
                            className="h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 shadow-[0_0_8px_rgba(236,72,153,0.8)]"
                          />
                        ) : (
                          <span className="shrink-0 text-xs text-slate-600 transition-all group-hover:translate-x-0.5 group-hover:text-brand-300">
                            →
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
