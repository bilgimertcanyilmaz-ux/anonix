import Link from "next/link";
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

export function FeedCard({ confession, liked }: FeedCardProps) {
  const {
    id,
    content,
    mood_tag,
    is_anonymous,
    like_count,
    comment_count,
    created_at,
    profiles,
  } = confession;

  return (
    <article className="card card-hover p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <AuthorBadge
          anonymous={is_anonymous}
          author={profiles}
          subtitle={timeAgo(created_at)}
        />
        {mood_tag && (
          <span className="chip shrink-0">
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
    </article>
  );
}
