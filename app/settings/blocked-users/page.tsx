"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { UserIdentity } from "@/components/UserIdentity";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { unblockUser } from "@/lib/blocks";
import type { Gender } from "@/types";

interface BlockedProfile {
  id: string;
  username: string;
  gender: Gender;
  is_anonymous: boolean;
  avatar_url: string | null;
}

export default function BlockedUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [people, setPeople] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: rows } = await supabase
      .from("blocked_users")
      .select("blocked_id")
      .eq("blocker_id", user.id);
    const ids = (rows ?? []).map((r) => r.blocked_id as string);
    if (ids.length === 0) {
      setPeople([]);
      setLoading(false);
      return;
    }
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username, gender, is_anonymous, avatar_url")
      .in("id", ids);
    setPeople((profs as BlockedProfile[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  async function handleUnblock(id: string) {
    if (!user) return;
    setBusyId(id);
    await unblockUser(user.id, id);
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setBusyId(null);
  }

  if (authLoading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-4">
        <div className="mb-4 flex items-center gap-2">
          <Link href="/settings/account" className="text-slate-400 hover:text-white">
            ←
          </Link>
          <h1 className="text-2xl font-extrabold text-white">Engellenenler</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="card h-16 animate-pulse" />
            ))}
          </div>
        ) : people.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">
            Henüz kimseyi engellemedin.
          </div>
        ) : (
          <div className="space-y-3">
            {people.map((p) => (
              <div key={p.id} className="card flex items-center justify-between gap-3 p-3">
                <UserIdentity
                  username={p.username}
                  gender={p.gender}
                  avatarUrl={p.avatar_url}
                  isAnonymous={p.is_anonymous}
                  showGender
                  showUsername
                />
                <button
                  type="button"
                  onClick={() => handleUnblock(p.id)}
                  disabled={busyId === p.id}
                  className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-60"
                >
                  {busyId === p.id ? "..." : "Engeli Kaldır"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
