"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { isPlusOrAbove, isUltraPlus, canUseFeature, FEATURE_REQUIRES_PLUS } from "@/lib/subscription";
import { getFollowCounts } from "@/lib/follows";

interface Stats {
  confessions: number;
  likes: number;
  comments: number;
  followers: number;
  // Ultra
  profileViews: number;
  topPostLikes: number;
  topCategory: string | null;
  weeklyEngagement: number;
  boostCount: number;
}

function StatCard({
  label,
  value,
  sub,
  href,
  action,
}: {
  label: string;
  value: string | number;
  sub?: string;
  /** Verilirse kart bu adrese tıklanabilir bir butona dönüşür. */
  href?: string;
  /** Tıklanabilir kartlarda gösterilen aksiyon etiketi (örn. "Kimler baktı? →"). */
  action?: string;
}) {
  const inner = (
    <>
      <p className="text-2xl font-extrabold text-white">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-brand-300">{sub}</p>}
      {action && (
        <p className="mt-1.5 text-[11px] font-bold text-amber-300 transition-colors group-hover:text-amber-200">
          {action}
        </p>
      )}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="group card block p-4 transition-all hover:border-amber-400/40 hover:bg-white/[0.04] hover:shadow-glow-sm"
      >
        {inner}
      </Link>
    );
  }
  return <div className="card p-4">{inner}</div>;
}

export default function ProfileAnalyticsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const toast = useToast();
  const [stats, setStats] = useState<Stats | null>(null);

  const ultra = isUltraPlus(profile) || profile?.role === "admin";

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isPlusOrAbove(profile) && profile?.role !== "admin") {
      toast.error(FEATURE_REQUIRES_PLUS);
      router.replace("/plus");
      return;
    }

    (async () => {
      const uid = user.id;
      const { data: confs } = await supabase
        .from("confessions")
        .select("like_count, comment_count, category, mood_tag, created_at, boost_score")
        .eq("user_id", uid)
        .limit(500);
      const rows = (confs as { like_count: number; comment_count: number; category: string | null; mood_tag: string | null; created_at: string; boost_score: number | null }[]) ?? [];

      const likes = rows.reduce((s, r) => s + (r.like_count ?? 0), 0);
      const comments = rows.reduce((s, r) => s + (r.comment_count ?? 0), 0);
      const counts = await getFollowCounts(uid);

      let profileViews = 0;
      let topPostLikes = 0;
      let topCategory: string | null = null;
      let weeklyEngagement = 0;
      let boostCount = 0;

      if (ultra) {
        const { count: pv } = await supabase
          .from("profile_views")
          .select("id", { count: "exact", head: true })
          .eq("profile_id", uid);
        profileViews = pv ?? 0;

        topPostLikes = rows.reduce((m, r) => Math.max(m, r.like_count ?? 0), 0);

        const catW: Record<string, number> = {};
        rows.forEach((r) => {
          const c = r.category ?? r.mood_tag;
          if (c) catW[c] = (catW[c] ?? 0) + 1 + (r.like_count ?? 0);
        });
        topCategory = Object.entries(catW).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

        const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
        weeklyEngagement = rows
          .filter((r) => new Date(r.created_at).getTime() > weekAgo)
          .reduce((s, r) => s + (r.like_count ?? 0) + (r.comment_count ?? 0), 0);

        boostCount = rows.reduce((s, r) => s + (r.boost_score ?? 0), 0);
      }

      setStats({
        confessions: rows.length,
        likes,
        comments,
        followers: counts.followers,
        profileViews,
        topPostLikes,
        topCategory,
        weeklyEngagement,
        boostCount,
      });
    })();
  }, [loading, user, profile, ultra, router, toast]);

  if (loading || !stats) {
    return (
      <Container>
        <div className="grid grid-cols-2 gap-3 py-6 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6 py-4">
        <h1 className="text-2xl font-extrabold text-white">İstatistiklerim</h1>

        <section>
          <h2 className="mb-2 text-sm font-bold text-slate-300">Temel</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Toplam itiraf" value={stats.confessions} />
            <StatCard label="Toplam beğeni" value={stats.likes} />
            <StatCard label="Toplam yorum" value={stats.comments} />
            <StatCard label="Takipçi" value={stats.followers} />
          </div>
        </section>

        {ultra ? (
          <section>
            <h2 className="mb-2 text-sm font-bold text-amber-200">Gelişmiş (Ultra Plus)</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                label="Profil görüntülenme"
                value={stats.profileViews}
                href="/profile/views"
                action="👁️ Kimler baktı? →"
              />
              <StatCard label="En çok beğeni alan" value={stats.topPostLikes} sub="tek paylaşım" />
              <StatCard label="En popüler kategori" value={stats.topCategory ?? "—"} />
              <StatCard label="Haftalık etkileşim" value={stats.weeklyEngagement} sub="son 7 gün" />
              <StatCard label="Boost performansı" value={stats.boostCount} sub="toplam boost" />
            </div>
          </section>
        ) : (
          <div className="card flex items-center justify-between gap-3 border-amber-400/30 p-4">
            <span className="text-sm text-slate-300">📈 Gelişmiş istatistikler Ultra Plus ile açılır.</span>
            <a href="/plus" className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-xs font-bold text-ink-900 shadow-glow">
              Ultra Plus’a Geç
            </a>
          </div>
        )}
      </div>
    </Container>
  );
}
