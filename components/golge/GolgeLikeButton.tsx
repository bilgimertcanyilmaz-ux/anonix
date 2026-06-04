"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { HeartIcon } from "@/components/ui/icons";

interface GolgeLikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
  /** "reels" = tam ekran akış için koyu cam daire + büyük ikon + alt sayı. */
  variant?: "default" | "reels";
}

export function GolgeLikeButton({ postId, initialLiked, initialCount, variant = "default" }: GolgeLikeButtonProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { error: toastError } = useToast();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toastError("Beğenmek için giriş yapmalısın.");
      router.push("/login");
      return;
    }
    if (profile?.is_banned) {
      toastError("Hesabınız topluluk kuralları nedeniyle kısıtlanmıştır.");
      return;
    }
    if (busy) return;

    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    setBusy(true);

    const { error } = next
      ? await supabase.from("golge_likes").insert({ golge_post_id: postId, user_id: user.id })
      : await supabase
          .from("golge_likes")
          .delete()
          .eq("golge_post_id", postId)
          .eq("user_id", user.id);

    setBusy(false);

    if (error) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toastError("Beğeni işlemi başarısız oldu. Tekrar dene.");
    }
  }

  if (variant === "reels") {
    return (
      <button
        onClick={handleClick}
        aria-pressed={liked}
        aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
        className="flex flex-col items-center gap-1"
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-black/45 ring-1 ring-white/20 backdrop-blur-sm transition-transform active:scale-90 ${
            liked ? "text-pink-500" : "text-white"
          }`}
        >
          <HeartIcon
            className="h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
            fill={liked ? "currentColor" : "none"}
          />
        </span>
        <span className="text-xs font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
          {count}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
        liked ? "text-pink-400" : "text-slate-300 hover:text-pink-300"
      }`}
    >
      <HeartIcon className="h-5 w-5" fill={liked ? "currentColor" : "none"} />
      {count}
    </button>
  );
}
