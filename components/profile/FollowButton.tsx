"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { isFollowing, followUser, unfollowUser } from "@/lib/follows";

interface FollowButtonProps {
  /** Takip edilecek kullanıcının id'si. */
  targetUserId: string;
  size?: "sm" | "md";
  /** Durum değişince üst bileşeni bilgilendir (örn. takipçi sayacı). */
  onChange?: (following: boolean) => void;
}

/**
 * Takip Et / Takip Ediliyor butonu.
 * Çıkış yapmışsa ya da kendi profili ise hiçbir şey göstermez.
 */
export function FollowButton({ targetUserId, size = "md", onChange }: FollowButtonProps) {
  const { user, profile } = useAuth();
  const { error: toastError, success } = useToast();
  const [following, setFollowing] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSelf = user?.id === targetUserId;

  useEffect(() => {
    if (!user || isSelf) {
      setReady(true);
      return;
    }
    let active = true;
    isFollowing(user.id, targetUserId).then((f) => {
      if (active) {
        setFollowing(f);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [user, targetUserId, isSelf]);

  if (!user || isSelf) return null;

  async function toggle() {
    if (!user || busy) return;
    if (profile?.is_banned) {
      toastError("Hesabınız topluluk kuralları nedeniyle kısıtlanmıştır.");
      return;
    }
    setBusy(true);
    if (following) {
      const { error } = await unfollowUser(user.id, targetUserId);
      if (error) {
        toastError("İşlem başarısız. Lütfen tekrar dene.");
      } else {
        setFollowing(false);
        onChange?.(false);
      }
    } else {
      const { error } = await followUser(user.id, targetUserId);
      if (error) {
        toastError("İşlem başarısız. Lütfen tekrar dene.");
      } else {
        setFollowing(true);
        onChange?.(true);
        success("Takip etmeye başladın 🎉");
      }
    }
    setBusy(false);
  }

  const sizing = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";
  const base = `inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-all active:scale-95 disabled:opacity-60 ${sizing}`;
  const styled = following
    ? "border border-white/15 bg-white/5 text-slate-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-200"
    : "bg-brand-gradient text-white shadow-glow hover:opacity-90";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !ready}
      aria-pressed={following}
      className={`${base} ${styled}`}
    >
      {following ? "Takip Ediliyor" : "Takip Et"}
    </button>
  );
}
