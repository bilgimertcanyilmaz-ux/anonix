"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { canUsePlusFeatures } from "@/lib/profile";
import { ChatIcon } from "@/components/ui/icons";

interface MessageButtonProps {
  /** İtiraf id'si; Gölge gibi itiraf olmayan bağlamlarda null. */
  confessionId?: string | null;
  authorId: string;
}

/** İtiraf sahibine özel mesaj başlatma butonu (yalnızca Plus üyeler). */
export function MessageButton({ confessionId, authorId }: MessageButtonProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { error: toastError } = useToast();
  const [busy, setBusy] = useState(false);

  // Kendi itirafına mesaj gönderilemez — butonu gizle.
  if (user && user.id === authorId) return null;

  async function handleClick() {
    if (!user) {
      toastError("Mesaj göndermek için giriş yapmalısın.");
      router.push("/login");
      return;
    }
    if (!canUsePlusFeatures(profile)) {
      toastError("Mesaj göndermek için Plus üye olmalısınız.");
      router.push("/plus");
      return;
    }

    setBusy(true);

    // Var olan konuşmayı bul ya da oluştur
    let q = supabase
      .from("conversations")
      .select("id")
      .eq("sender_id", user.id)
      .eq("receiver_id", authorId);
    q = confessionId ? q.eq("confession_id", confessionId) : q.is("confession_id", null);
    const { data: existing } = await q.maybeSingle();

    let convId = existing?.id as string | undefined;

    if (!convId) {
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          confession_id: confessionId ?? null,
          sender_id: user.id,
          receiver_id: authorId,
        })
        .select("id")
        .single();

      if (error || !created) {
        setBusy(false);
        toastError("Konuşma başlatılamadı. Lütfen tekrar dene.");
        return;
      }
      convId = created.id;
    }

    router.push(`/messages/${convId}`);
  }

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-2 text-xs font-semibold text-white shadow-glow transition-transform active:scale-95 disabled:opacity-60 sm:text-sm"
    >
      <ChatIcon className="h-4 w-4 shrink-0" />
      {busy ? "Açılıyor..." : "Mesaj Gönder"}
    </button>
  );
}
