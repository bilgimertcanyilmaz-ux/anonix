import Link from "next/link";
import type { GolgePost } from "@/types";
import { moodEmoji } from "@/lib/moods";
import { unpackOverlay, overlayStyleClass, overlayPositionClass } from "@/lib/golge";
import { HeartIcon, ChatIcon } from "@/components/ui/icons";

/**
 * Instagram keşfet tarzı kare grid hücresi.
 * Sadece görsel + (varsa) overlay yazı + mood; hover/tap'te beğeni/yorum sayısı.
 * Açıklama/kullanıcı bilgisi gridde gösterilmez (detayda görünür).
 */
export function GolgeExploreTile({ post, large = false }: { post: GolgePost; large?: boolean }) {
  const { style, position } = unpackOverlay(post.overlay_style);

  return (
    <Link
      href={`/golge/${post.id}`}
      aria-label="Gölge paylaşımı"
      className={`group relative aspect-square overflow-hidden bg-ink-800 ${
        large ? "col-span-2 row-span-2" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={post.image_url}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Görsel üstü yazı (paylaşımın kendi overlay'i) */}
      {post.overlay_text && (
        <div
          className={`pointer-events-none absolute inset-0 flex justify-center p-2 ${overlayPositionClass(position)}`}
        >
          <p
            className={`gi-overlay line-clamp-3 max-w-full break-words text-center text-xs font-bold leading-tight ${overlayStyleClass(style)}`}
          >
            {post.overlay_text}
          </p>
        </div>
      )}

      {/* Mood etiketi */}
      {post.mood_tag && (
        <span className="absolute left-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
          {moodEmoji(post.mood_tag)} {post.mood_tag}
        </span>
      )}

      {/* Hover/tap: beğeni & yorum sayısı */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-4 bg-black/45 text-sm font-bold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className="inline-flex items-center gap-1">
          <HeartIcon className="h-4 w-4" /> {post.like_count}
        </span>
        <span className="inline-flex items-center gap-1">
          <ChatIcon className="h-4 w-4" /> {post.comment_count}
        </span>
      </div>
    </Link>
  );
}
