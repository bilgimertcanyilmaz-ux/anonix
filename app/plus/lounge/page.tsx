"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { FeedCard } from "@/components/confession/FeedCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { canUseFeature, FEATURE_REQUIRES_ULTRA } from "@/lib/subscription";
import { nonExpiredFilter } from "@/lib/feeds";
import { LOUNGE_ROOMS } from "@/lib/lounge";
import type { ConfessionRecord } from "@/types";

const CONF_SELECT = "*, profiles(username, gender, is_anonymous, avatar_url, premium_theme)";

export default function PlusLoungePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const toast = useToast();
  const [room, setRoom] = useState(LOUNGE_ROOMS[0]);
  const [rows, setRows] = useState<ConfessionRecord[]>([]);
  const [busy, setBusy] = useState(true);

  const allowed = canUseFeature(profile, "plus_lounge");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!allowed) {
      toast.error(FEATURE_REQUIRES_ULTRA);
      router.replace("/plus");
    }
  }, [loading, user, allowed, router, toast]);

  const load = useCallback(async () => {
    setBusy(true);
    const { data } = await supabase
      .from("confessions")
      .select(CONF_SELECT)
      .eq("plus_room_type", room)
      .or(nonExpiredFilter())
      .order("created_at", { ascending: false })
      .limit(40);
    setRows(((data as ConfessionRecord[]) ?? []).filter((r) => (r.moderation_status ?? "approved") === "approved"));
    setBusy(false);
  }, [room]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  if (loading || !allowed) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-4">
        <div className="mb-4 rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-amber-500/15 to-brand-700/30 p-5 shadow-glow">
          <h1 className="text-2xl font-extrabold text-white">🚪 Plus Lounge</h1>
          <p className="text-sm text-amber-100/80">Yalnızca Ultra Plus üyelerin eriştiği özel odalar.</p>
        </div>

        {/* Oda seçimi */}
        <div className="-mx-1 mb-5 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-x-visible">
          {LOUNGE_ROOMS.map((r) => (
            <button
              key={r}
              onClick={() => setRoom(r)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                room === r
                  ? "border-amber-400/60 bg-amber-400/15 text-amber-100"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {busy ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="card h-32 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            “{room}” odasında henüz paylaşım yok. İlk paylaşımı sen yap (İtiraf Yaz → özel oda).
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((c) => (
              <FeedCard key={c.id} confession={c} liked={false} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
