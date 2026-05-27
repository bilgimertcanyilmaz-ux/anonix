"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserIdentity } from "@/components/UserIdentity";
import { canUseFeature } from "@/lib/subscription";
import type { ConfessionAuthor } from "@/types";

interface Liker {
  user_id: string;
  profiles: ConfessionAuthor | null;
}

/**
 * "Kim Beğendi" modalı (Plus / Ultra Plus özelliği).
 * - Free kullanıcı: yükseltme çağrısı.
 * - Plus+: beğenenler listelenir; anonimler "Anonim Kullanıcı".
 */
export function LikersModal({
  entityType,
  id,
  open,
  onClose,
}: {
  entityType: "confession" | "golge";
  id: string;
  open: boolean;
  onClose: () => void;
}) {
  const { profile } = useAuth();
  const allowed = canUseFeature(profile, "see_likers");
  const [likers, setLikers] = useState<Liker[]>([]);
  const [loading, setLoading] = useState(false);

  const table = entityType === "confession" ? "confession_likes" : "golge_likes";
  const idCol = entityType === "confession" ? "confession_id" : "golge_post_id";

  useEffect(() => {
    if (!open || !allowed) return;
    setLoading(true);
    supabase
      .from(table)
      .select(`user_id, profiles:user_id (username, gender, avatar_url, is_anonymous)`)
      .eq(idCol, id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setLikers((data as unknown as Liker[]) ?? []);
        setLoading(false);
      });
  }, [open, allowed, table, idCol, id]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div className="card max-h-[70vh] w-full max-w-md overflow-hidden p-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h3 className="text-base font-bold text-white">❤️ Beğenenler</h3>
          <button onClick={onClose} aria-label="Kapat" className="rounded-full px-2 text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        {!allowed ? (
          <div className="p-6 text-center">
            <p className="text-3xl">🔒</p>
            <p className="mt-3 text-sm text-slate-300">
              Kimlerin beğendiğini görmek için Plus’a geçmelisin.
            </p>
            <Link
              href="/plus"
              className="mt-4 inline-flex rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white shadow-glow"
            >
              Plus’a Geç
            </Link>
          </div>
        ) : loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : likers.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">Henüz beğeni yok.</p>
        ) : (
          <div className="max-h-[55vh] space-y-1 overflow-y-auto p-3">
            {likers.map((l) => (
              <div key={l.user_id} className="rounded-xl px-2 py-1.5 hover:bg-white/5">
                <UserIdentity
                  username={l.profiles?.username ?? ""}
                  gender={l.profiles?.gender ?? "other"}
                  avatarUrl={l.profiles?.avatar_url ?? null}
                  isAnonymous={l.profiles?.is_anonymous ?? true}
                  showUsername
                  size="sm"
                  profileHref={l.profiles?.username ? `/users/${l.profiles.username}` : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
