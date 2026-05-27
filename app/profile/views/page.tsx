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
            {views.map((v) => {
              const anon = v.profiles?.is_anonymous ?? true;
              return (
                <div key={v.id} className="card flex items-center justify-between gap-3 p-3">
                  {anon || !v.profiles ? (
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg">
                        🥷
                      </span>
                      <span className="text-sm font-semibold text-slate-300">Anonim Ziyaretçi</span>
                    </div>
                  ) : (
                    <UserIdentity
                      username={v.profiles.username}
                      gender={v.profiles.gender}
                      avatarUrl={v.profiles.avatar_url ?? null}
                      isAnonymous={false}
                      showUsername
                      size="sm"
                      profileHref={`/users/${v.profiles.username}`}
                    />
                  )}
                  <span className="shrink-0 text-xs text-slate-500">{timeAgo(v.created_at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
