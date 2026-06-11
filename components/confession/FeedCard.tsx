"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { ConfessionRecord } from "@/types";
import { moodEmoji, moodAccent } from "@/lib/moods";
import { timeAgo } from "@/lib/format";
import { isBoosted } from "@/lib/boost";
import { AuthorBadge } from "@/components/confession/AuthorBadge";
import { LikeButton } from "@/components/confession/LikeButton";
import { ChatIcon } from "@/components/ui/icons";

interface FeedCardProps {
  confession: ConfessionRecord;
  liked: boolean;
}

/** Bu uzunluğun üzerindeki itiraflar feed'de kısaltılıp "Devamını oku" ile açılır. */
const CLAMP_THRESHOLD = 360;
const CLAMP_LINES = 8;

/**
 * Premium glass feed card.
 * Mood'a göre renklenen kenar şeridi + çip; uzun itiraflar "Devamını oku" ile açılır.
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
  const accent = moodAccent(mood_tag);
  const boosted = isBoosted(confession.boosted_until);
  const isLong = content.length > CLAMP_THRESHOLD;
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      whileHover={{ y: -2 }}
      className={`glass-card glass-card-hover relative p-5 ${boosted ? "ring-1 ring-amber-400/40" : ""}`}
      style={boosted ? { boxShadow: "0 0 24px -10px rgba(251,191,36,0.55)" } : undefined}
    >
      {/* Sol kenar mood şeridi — kategori rengini taşır */}
      {mood_tag && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-4 left-0 w-1 rounded-r opacity-80"
          style={{ background: `linear-gradient(to bottom, ${accent.a}, ${accent.b}, transparent)` }}
        />
      )}

      <div className="mb-3 flex items-center justify-between gap-3">
        <AuthorBadge
          anonymous={is_anonymous}
          author={profiles}
          subtitle={timeAgo(created_at)}
        />
        <div className="flex shrink-0 items-center gap-1.5">
          {boosted && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              🚀 Öne çıkarıldı
            </span>
          )}
          {mood_tag && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur"
              style={{
                background: `${accent.a}1f`,
                color: accent.a,
                boxShadow: `inset 0 0 0 1px ${accent.a}55`,
              }}
            >
              <span>{moodEmoji(mood_tag)}</span>
              {mood_tag}
            </span>
          )}
        </div>
      </div>

      {isLong ? (
        <div>
          <p
            className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-200"
            style={
              expanded
                ? undefined
                : {
                    display: "-webkit-box",
                    WebkitLineClamp: CLAMP_LINES,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }
            }
          >
            {content}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-brand-300 transition-colors hover:bg-white/10 hover:text-brand-200"
          >
            {expanded ? "Daha az göster ▴" : "Devamını oku ▾"}
          </button>
        </div>
      ) : (
        <Link href={`/confessions/${id}`} className="block">
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-slate-200">
            {content}
          </p>
        </Link>
      )}

      {/* Aksiyon çubuğu */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
        <div className="flex items-center gap-5">
          <LikeButton
            confessionId={id}
            initialLiked={liked}
            initialCount={like_count}
            moodTag={mood_tag}
          />
          <Link
            href={`/confessions/${id}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-sky-300"
          >
            <ChatIcon className="h-4 w-4" />
            {comment_count}
          </Link>
        </div>
        <Link
          href={`/confessions/${id}`}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-brand-300"
        >
          Oku
          <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </motion.article>
  );
}
