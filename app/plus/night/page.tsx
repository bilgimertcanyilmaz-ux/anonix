"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { FeedCard } from "@/components/confession/FeedCard";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { canUseFeature, FEATURE_REQUIRES_ULTRA } from "@/lib/subscription";
import { isNightHours, nonExpiredFilter } from "@/lib/feeds";
import type { ConfessionRecord } from "@/types";

const CONF_SELECT = "*, profiles(username, gender, is_anonymous, avatar_url)";

export default function NightAreaPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState<ConfessionRecord[]>([]);
  const [busy, setBusy] = useState(true);
  const night = isNightHours();
  const allowed = canUseFeature(profile, "night_area");

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
    const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    const { data } = await supabase
      .from("confessions")
      .select(CONF_SELECT)
      .gte("created_at", since)
      .or(nonExpiredFilter())
      .order("created_at", { ascending: false })
      .limit(30);
    setRows(((data as ConfessionRecord[]) ?? []).filter((r) => (r.moderation_status ?? "approved") === "approved" && !r.plus_room_type));
    setBusy(false);
  }, []);

  useEffect(() => {
    if (allowed && night) load();
  }, [allowed, night, load]);

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
        <div className="mb-5 rounded-2xl border border-brand-500/30 bg-gradient-to-br from-brand-800 via-ink-900 to-black p-6 text-center shadow-glow">
          <h1 className="text-2xl font-extrabold text-white">🌙 Gece Alanı</h1>
          <p className="mt-1 text-sm text-brand-200/70">Gecenin sessizliğine özel Ultra Plus alanı.</p>
        </div>

        {!night ? (
          <div className="card p-10 text-center">
            <p className="text-4xl">🌙</p>
            <p className="mt-3 text-sm text-slate-300">Gece alanı 00:00’da açılır.</p>
            <p className="mt-1 text-xs text-slate-500">00:00 – 05:00 arası aktiftir.</p>
          </div>
        ) : busy ? (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="card h-32 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">Gece henüz sessiz…</div>
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
