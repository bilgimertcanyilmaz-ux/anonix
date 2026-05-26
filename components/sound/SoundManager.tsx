"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

/**
 * Giriş yapan kullanıcıya realtime ses bildirimi çalar:
 * - Yeni bildirim (notifications) → /sounds/notification.mp3
 * - Yeni gelen mesaj (messages, sender != ben) → /sounds/message.mp3
 * Kullanıcının ses tercihleri profiles.notification_sound_enabled /
 * message_sound_enabled ile kontrol edilir. UI render etmez.
 *
 * NOT: Ses dosyalarını public/sounds/ altına ekleyin:
 *   public/sounds/notification.mp3
 *   public/sounds/message.mp3
 * Dosya yoksa ses sessizce atlanır (uygulama çalışmaya devam eder).
 */
export function SoundManager() {
  const { user, profile } = useAuth();
  const prefs = useRef({ notif: true, msg: true });

  useEffect(() => {
    prefs.current = {
      notif: profile?.notification_sound_enabled ?? true,
      msg: profile?.message_sound_enabled ?? true,
    };
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    function play(src: string) {
      try {
        const audio = new Audio(src);
        audio.volume = 0.5;
        // Tarayıcı autoplay engeli veya eksik dosya → sessizce yut.
        void audio.play().catch(() => {});
      } catch {
        /* yok say */
      }
    }

    const channel = supabase
      .channel(`sound:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Mesaj bildirimi sesini message kanalı yönetir; burada tekrar çalma.
          const type = (payload.new as { type?: string })?.type;
          if (type === "message") return;
          if (prefs.current.notif) play("/sounds/notification.mp3");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const senderId = (payload.new as { sender_id?: string })?.sender_id;
          if (senderId === user.id) return; // kendi mesajımda çalma
          if (prefs.current.msg) play("/sounds/message.mp3");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
