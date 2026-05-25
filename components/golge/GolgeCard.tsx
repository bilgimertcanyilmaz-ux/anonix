import Link from "next/link";
import type { GolgePost } from "@/types";
import { moodEmoji } from "@/lib/moods";
import { GolgeImage } from "@/components/golge/GolgeImage";
import { GolgeLikeButton } from "@/components/golge/GolgeLikeButton";
import { ChatIcon } from "@/components/ui/icons";

interface GolgeCardProps {
  post: GolgePost;
  liked: boolean;
}

export function GolgeCard({ post, liked }: GolgeCardProps) {
  const author =
    !post.is_anonymous && post.profiles?.username
      ? `@${post.profiles.username}`
      : "Anonim Kullanıcı";

  return (
    <div className="group mb-3 break-inside-avoid">
      <div className="card overflow-hidden p-0 transition-transform duration-300 group-hover:-translate-y-0.5">
        <Link href={`/golge/${post.id}`} className="relative block">
          <GolgeImage
            imageUrl={post.image_url}
            overlayText={post.overlay_text}
            overlay={post.overlay_style}
            rounded={false}
            textSize="text-lg"
          />
          {post.mood_tag && (
            <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {moodEmoji(post.mood_tag)} {post.mood_tag}
            </span>
          )}
          {/* alt gradyan */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
        </Link>

        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <span className="truncate text-xs font-semibold text-slate-200">{author}</span>
          <div className="flex items-center gap-3">
            <GolgeLikeButton
              postId={post.id}
              initialLiked={liked}
              initialCount={post.like_count}
            />
            <Link
              href={`/golge/${post.id}`}
              className="inline-flex items-center gap-1 text-sm text-slate-300 hover:text-brand-300"
            >
              <ChatIcon className="h-4 w-4" />
              {post.comment_count}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
