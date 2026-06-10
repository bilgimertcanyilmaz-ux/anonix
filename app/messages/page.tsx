"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { timeAgo } from "@/lib/format";
import { UserIdentity } from "@/components/UserIdentity";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Conversation, Gender } from "@/types";

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [genderMap, setGenderMap] = useState<Record<string, Gender>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("conversations")
      .select("*, confessions(content, is_anonymous)")
      .order("updated_at", { ascending: false });
    const convos = (data as Conversation[]) ?? [];
    setConversations(convos);

    // Karşı katılımcıların cinsiyetini çek (kimlik gizli kalır, cinsiyet her zaman görünür)
    const otherIds = Array.from(
      new Set(convos.map((c) => (c.sender_id === user.id ? c.receiver_id : c.sender_id)))
    );
    if (otherIds.length > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, gender")
        .in("id", otherIds);
      const map: Record<string, Gender> = {};
      (profs ?? []).forEach((p) => {
        map[p.id as string] = p.gender as Gender;
      });
      setGenderMap(map);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

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
        <h1 className="mb-5 text-2xl font-extrabold text-white">Mesajlar</h1>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card h-20 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="Henüz mesajın yok"
            description="Bir itirafı beğenip sahibine mesaj göndererek sohbete başla."
            actionLabel="Keşfet'e git"
            actionHref="/confessions"
          />
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => {
              const preview = c.confessions?.content
                ? `İtiraf: ${c.confessions.content}`
                : "Özel sohbet";
              const otherId = c.sender_id === user.id ? c.receiver_id : c.sender_id;
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="card card-hover flex items-center gap-3 p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <UserIdentity
                        gender={genderMap[otherId]}
                        isAnonymous
                        showGender
                        showUsername={false}
                      />
                      <span className="shrink-0 text-xs text-slate-500">
                        {timeAgo(c.updated_at)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">{preview}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
