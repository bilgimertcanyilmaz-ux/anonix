"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { recordDailyStreak } from "@/lib/streaks";

/** Giriş yapan kullanıcı için günlük streak'i (gün içinde bir kez) kaydeder. */
export function StreakTracker() {
  const { user, refreshProfile } = useAuth();
  const { success } = useToast();
  const done = useRef(false);

  useEffect(() => {
    if (!user || done.current) return;
    done.current = true;
    (async () => {
      const res = await recordDailyStreak();
      if (res.changed) {
        success(`Günlük giriş! ${res.streak} günlük streak 🔥 +${res.reward ?? 0} puan`);
        refreshProfile();
      }
    })();
  }, [user, success, refreshProfile]);

  return null;
}
