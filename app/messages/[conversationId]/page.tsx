"use client";

import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { useUnread } from "@/components/messages/UnreadProvider";
import { canUsePlusFeatures } from "@/lib/profile";
import { canUseFeature } from "@/lib/subscription";
import { UserIdentity } from "@/components/UserIdentity";
import { BlockButton } from "@/components/profile/BlockButton";
import type { Message, Conversation, Gender } from "@/types";

const MAX = 500;

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const convId = String(params.conversationId);

  const { user, profile, loading: authLoading } = useAuth();
  const { error: toastError } = useToast();
  const { refresh: refreshUnread } = useUnread();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherGender, setOtherGender] = useState<Gender | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [disappearing, setDisappearing] = useState(false);
  const canDisappear = canUseFeature(profile, "disappearing_messages");

  const bottomRef = useRef<HTMLDivElement>(null);

  /** Süresi dolan kaybolan mesajları gizle. */
  const notExpired = (m: Message) => !m.expires_at || new Date(m.expires_at) > new Date();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Karşı tarafın id'si (kimlik gizli, sadece yönlendirme için)
  const otherId =
    conversation && user
      ? conversation.sender_id === user.id
        ? conversation.receiver_id
        : conversation.sender_id
      : null;

  const markRead = useCallback(async () => {
    if (!user) return;
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", convId)
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    refreshUnread();
  }, [convId, user, refreshUnread]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: conv } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", convId)
      .maybeSingle();

    if (!conv) {
      setDenied(true);
      setLoading(false);
      return;
    }
    setConversation(conv as Conversation);

    // Karşı tarafın cinsiyeti (kimlik gizli, cinsiyet her zaman görünür)
    const other =
      (conv as Conversation).sender_id === user.id
        ? (conv as Conversation).receiver_id
        : (conv as Conversation).sender_id;
    const { data: otherProfile } = await supabase
      .from("profiles")
      .select("gender")
      .eq("id", other)
      .maybeSingle();
    setOtherGender(((otherProfile?.gender as Gender) ?? null));

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setMessages((msgs as Message[]) ?? []);
    setLoading(false);

    markRead();
  }, [convId, user, markRead]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  // Realtime: bu konuşmaya gelen yeni mesajlar
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`conv:${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
          if (m.receiver_id === user.id) markRead();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [convId, user, markRead]);

  // Yeni mesajda en alta kaydır
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (content.length > MAX) {
      toastError(`Mesaj en fazla ${MAX} karakter olabilir.`);
      return;
    }
    if (profile?.is_banned) {
      toastError("Hesabınız topluluk kuralları nedeniyle kısıtlanmıştır.");
      return;
    }
    if (!canUsePlusFeatures(profile)) {
      toastError("Mesaj göndermek için Plus üye olmalısınız.");
      return;
    }
    if (!user || !otherId) return;

    setSending(true);
    const useDisappear = disappearing && canDisappear;
    const msgPayload: Record<string, unknown> = {
      conversation_id: convId,
      sender_id: user.id,
      receiver_id: otherId,
      content,
    };
    // Kaybolan mesaj alanları yalnızca kullanıldığında eklenir (kolon yoksa normal mesaj bozulmasın)
    if (useDisappear) {
      msgPayload.is_disappearing = true;
      msgPayload.expires_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
    }
    const { data, error } = await supabase
      .from("messages")
      .insert(msgPayload)
      .select("*")
      .single();
    setSending(false);

    if (error) {
      toastError("Mesaj gönderilemedi. Lütfen tekrar dene.");
      return;
    }
    setText("");
    if (data) {
      setMessages((prev) =>
        prev.some((x) => x.id === (data as Message).id) ? prev : [...prev, data as Message]
      );
    }
  }

  if (authLoading || !user || loading) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  if (denied || !conversation) {
    return (
      <Container>
        <div className="card my-8 p-8 text-center">
          <p className="text-sm text-slate-400">Bu konuşmaya erişimin yok.</p>
          <div className="mt-4">
            <Button variant="ghost" onClick={() => router.push("/messages")}>
              Mesajlara dön
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex h-[calc(100vh-9rem)] flex-col">
      {/* Başlık */}
      <div className="flex items-center gap-3 border-b border-white/5 py-3">
        <Link href="/messages" className="text-slate-400 hover:text-white">
          ←
        </Link>
        <UserIdentity
          gender={otherGender}
          isAnonymous
          showGender
          showUsername={false}
          subtitle="Kimlik gizli"
        />
        {otherId && (
          <div className="ml-auto">
            <BlockButton targetUserId={otherId} size="sm" />
          </div>
        )}
      </div>

      {/* Mesajlar */}
      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">
            Henüz mesaj yok. İlk mesajı sen gönder.
          </p>
        ) : (
          messages.filter(notExpired).map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    mine
                      ? "rounded-br-md bg-brand-gradient text-white"
                      : "rounded-bl-md bg-white/[0.06] text-slate-200"
                  }`}
                >
                  {/* React metni varsayılan olarak escape eder → XSS güvenli */}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  {m.is_disappearing && (
                    <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-slate-400"}`}>
                      ⏳ 24 saatte kaybolur
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Ultra Plus: kaybolan mesaj toggle */}
      {canDisappear && (
        <button
          type="button"
          onClick={() => setDisappearing((v) => !v)}
          className="flex items-center justify-between gap-2 border-t border-white/5 px-1 pt-2 text-left"
        >
          <span className="text-xs text-slate-400">⏳ 24 saatte kaybolan mesaj</span>
          <span className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${disappearing ? "bg-amber-500" : "bg-white/15"}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${disappearing ? "translate-x-[18px]" : "translate-x-0.5"}`} />
          </span>
        </button>
      )}

      {/* Yazma alanı */}
      <form onSubmit={handleSend} className={`flex items-end gap-2 py-3 ${canDisappear ? "" : "border-t border-white/5"}`}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX}
          rows={1}
          placeholder="Mesaj yaz..."
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-500/60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as FormEvent);
            }
          }}
        />
        <Button type="submit" disabled={sending || !text.trim()} className="!px-5 !py-3">
          {sending ? "..." : "Gönder"}
        </Button>
      </form>
    </Container>
  );
}
