"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { HeartIcon } from "@/components/ui/icons";

interface CommentLikeButtonProps {
  commentId: string;
  initialLiked: boolean;
  initialCount: number;
}

/** Bir yoruma beğeni butonu (❤️ + sayaç). Optimistik UI, hatada geri alır. */
export function CommentLikeButton({ commentId, initialLiked, initialCount }: CommentLikeButtonProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { error: toastError } = useToast();

  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function handleClick() {
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
      ? await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: user.id })
      : await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);

    setBusy(false);

    if (error) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toastError("Beğeni işlemi başarısız oldu. Tekrar dene.");
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-pressed={liked}
      aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
      className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
        liked ? "text-pink-400" : "text-slate-400 hover:text-pink-300"
      }`}
    >
      <HeartIcon className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
      {count > 0 && count}
    </button>
  );
}
