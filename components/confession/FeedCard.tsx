"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ConfessionRecord } from "@/types";
import { moodEmoji } from "@/lib/moods";
import { timeAgo } from "@/lib/format";
import { AuthorBadge } from "@/components/confession/AuthorBadge";
import { LikeButton } from "@/components/confession/LikeButton";
import { ChatIcon } from "@/components/ui/icons";

interface FeedCardProps {
  confession: ConfessionRecord;
  liked: boolean;
}

/**
 * Premium glass feed card — UI redesign Faz 1.
 * Glassmorphism + subtle hover lift + neon border + category accent chip.
 */
export function FeedCard({ confession, liked }: FeedCardProps) {
  const {
    id,
    content,
    is_anonymous,
    like_count,
    comment_count,
    created_at,
    profiles,
  } = confession;
  const mood_tag = confession.mood_tag ?? confession.category ?? null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      whileHover={{ y: -2 }}
      className="glass-card glass-card-hover relative p-5"
    >
      {/* Sol kenar mood accent (mor neon stripe) */}
      {mood_tag && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-4 left-0 w-1 rounded-r bg-gradient-to-b from-brand-400 via-brand-500 to-transparent opacity-70"
        />
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <AuthorBadge
          anonymous={is_anonymous}
          author={profiles}
          subtitle={timeAgo(created_at)}
        />
        {mood_tag && (
          <span className="chip-neon shrink-0">
            <span>{moodEmoji(mood_tag)}</span>
            {mood_tag}
          </span>
        )}
      </div>

      <Link href={`/confessions/${id}`} className="block">
        <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-slate-200">
          {content}
        </p>
      </Link>

      <div className="mt-4 flex items-center gap-5">
        <LikeButton
          confessionId={id}
          initialLiked={liked}
          initialCount={like_count}
          moodTag={mood_tag}
        />
        <Link
          href={`/confessions/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-brand-300"
        >
          <ChatIcon className="h-4 w-4" />
          {comment_count}
        </Link>
      </div>
    </motion.article>
  );
}
