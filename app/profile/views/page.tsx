"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { UserIdentity } from "@/components/UserIdentity";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { canUseFeature, FEATURE_REQUIRES_ULTRA } from "@/lib/subscription";
import { getProfileViews } from "@/lib/profileViews";
import { timeAgo } from "@/lib/format";
import type { ProfileView } from "@/types";

export default function ProfileViewsPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const toast = useToast();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canUseFeature(profile, "profile_views")) {
      toast.error(FEATURE_REQUIRES_ULTRA);
      router.replace("/plus");
      return;
    }
    getProfileViews(user.id).then((v) => {
      setViews(v);
      setBusy(false);
    });
  }, [loading, user, profile, router, toast]);

  if (loading || busy) {
    return (
      <Container>
        <div className="space-y-2 py-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-14 animate-pulse" />
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg">
      <div className="py-4">
        <h1 className="mb-1 text-2xl font-extrabold text-white">Profilime Kimler Baktı</h1>
        <p className="mb-5 text-sm text-slate-400">
          Son profil ziyaretçilerin. Hayalet moddaki kullanıcılar listede görünmez.
        </p>

        {views.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            Henüz profil ziyaretçin yok.
          </div>
        ) : (
          <div className="space-y-2">
            {views.map((v) => (
              <div key={v.id} className="card flex items-center justify-between gap-3 p-3">
                {!v.profiles?.username ? (
                  // Yalnızca ziyaretçi hesabı silinmiş/yoksa kimlik gösterilemez.
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">
                      🥷
                    </span>
                    <span className="text-sm font-semibold text-slate-300">Bilinmeyen Ziyaretçi</span>
                  </div>
                ) : (
                  // Ultra Plus ayrıcalığı: ziyaretçi anonim modda olsa bile gerçek kimliği gösterilir.
                  <div className="flex min-w-0 items-center gap-2">
                    <UserIdentity
                      username={v.profiles.username}
                      gender={v.profiles.gender}
                      avatarUrl={v.profiles.avatar_url ?? null}
                      premiumTheme={v.profiles.premium_theme}
                      isAnonymous={false}
                      showUsername
                      size="sm"
                      profileHref={`/users/${v.profiles.username}`}
                    />
                    {v.profiles.is_anonymous && (
                      <span
                        className="shrink-0 rounded-full border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300"
                        title="Bu kullanıcı anonim modda; Ultra Plus sayesinde kimliği sana görünüyor."
                      >
                        🎭 anonim
                      </span>
                    )}
                  </div>
                )}
                <span className="shrink-0 text-xs text-slate-500">{timeAgo(v.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
