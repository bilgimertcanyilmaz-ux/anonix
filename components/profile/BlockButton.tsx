"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { isBlocked, blockUser, unblockUser } from "@/lib/blocks";

interface BlockButtonProps {
  targetUserId: string;
  size?: "sm" | "md";
  onChange?: (blocked: boolean) => void;
}

/**
 * Kullanıcı engelle / engeli kaldır. Çıkış yapmışsa veya kendi profili ise gizli.
 */
export function BlockButton({ targetUserId, size = "md", onChange }: BlockButtonProps) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [blocked, setBlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const isSelf = user?.id === targetUserId;

  useEffect(() => {
    if (!user || isSelf) {
      setReady(true);
      return;
    }
    let active = true;
    isBlocked(user.id, targetUserId).then((b) => {
      if (active) {
        setBlocked(b);
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
    setBusy(true);
    if (blocked) {
      const { error } = await unblockUser(user.id, targetUserId);
      if (error) toastError("İşlem başarısız. Lütfen tekrar dene.");
      else {
        setBlocked(false);
        onChange?.(false);
        success("Engel kaldırıldı.");
      }
    } else {
      const { error } = await blockUser(user.id, targetUserId);
      if (error) toastError("İşlem başarısız. Lütfen tekrar dene.");
      else {
        setBlocked(true);
        onChange?.(true);
        success("Kullanıcı engellendi.");
      }
    }
    setBusy(false);
  }

  const sizing = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !ready}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border font-semibold transition-colors disabled:opacity-60 ${sizing} ${
        blocked
          ? "border-white/15 bg-white/5 text-slate-300 hover:bg-white/10"
          : "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
      }`}
    >
      {blocked ? "Engeli Kaldır" : "Engelle"}
    </button>
  );
}
