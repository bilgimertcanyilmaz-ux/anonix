"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { timeAgo } from "@/lib/format";
import { MaskIcon } from "@/components/ui/icons";
import type { Conversation } from "@/types";

export default function MessagesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
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
    setConversations((data as Conversation[]) ?? []);
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
          <div className="card p-8 text-center">
            <p className="text-sm text-slate-400">
              Henüz mesajın yok. Bir itirafı beğenip sahibine mesaj göndererek başla.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((c) => {
              const preview = c.confessions?.content
                ? `İtiraf: ${c.confessions.content}`
                : "Özel sohbet";
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="card card-hover flex items-center gap-3 p-4"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300">
                    <MaskIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-white">
                        Anonim Kullanıcı
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">
                        {timeAgo(c.updated_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      İtiraf: {preview}
                    </p>
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
