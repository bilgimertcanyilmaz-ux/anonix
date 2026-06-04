"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  unpackOverlay,
  overlayStyleClass,
  overlayPositionClass,
  overlayBoxClass,
} from "@/lib/golge";
import { moodEmoji } from "@/lib/moods";
import { GolgeLikeButton } from "@/components/golge/GolgeLikeButton";
import { ChatIcon } from "@/components/ui/icons";
import type { GolgePost } from "@/types";

/** Navbar yüksekliği (h-16) + çentik güvenli alanı. */
const TOP_OFFSET = "calc(4rem + env(safe-area-inset-top))";

interface GolgeReelsProps {
  posts: GolgePost[];
  likedIds: Set<string>;
  loadMore: () => void;
  hasMore: boolean;
}

/**
 * Instagram Reels tarzı dikey tam-ekran Gölge akışı.
 * Her gönderi bir "slayt"; aşağı/yukarı kaydırınca snap ile diğerine geçilir.
 */
export function GolgeReels({ posts, likedIds, loadMore, hasMore }: GolgeReelsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "800px" }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [loadMore]);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 snap-y snap-mandatory overflow-y-auto overscroll-contain bg-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style={{ top: TOP_OFFSET }}
    >
      {posts.map((p) => {
        const { style, position } = unpackOverlay(p.overlay_style);
        const author = p.profiles;
        const named = author && !author.is_anonymous && author.username;
        return (
          <section
            key={p.id}
            className="flex h-full w-full snap-start snap-always items-center justify-center"
          >
            <div className="relative mx-auto h-full w-full max-w-md">
              {/* Görsel */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image_url}
                alt={p.overlay_text || "Gölge paylaşımı"}
                className="h-full w-full object-contain"
                draggable={false}
              />

              {/* Overlay yazı */}
              {p.overlay_text && (
                <div
                  className={`pointer-events-none absolute inset-0 flex justify-center p-4 ${overlayPositionClass(position)}`}
                >
                  <p
                    className={`gi-overlay max-w-full break-words text-center text-xl leading-snug sm:text-2xl ${overlayStyleClass(style)} ${overlayBoxClass(style)}`}
                  >
                    {p.overlay_text}
                  </p>
                </div>
              )}

              {/* Alt gradyan */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

              {/* Sol-alt: mood + yazar + açıklama */}
              <div className="absolute inset-x-0 bottom-0 left-0 right-16 p-4 pb-24">
                {p.mood_tag && (
                  <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {moodEmoji(p.mood_tag)} {p.mood_tag}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {named ? (
                    <Link href={`/users/${author!.username}`} className="text-sm font-bold text-white">
                      @{author!.username}
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-white/90">Anonim Kullanıcı</span>
                  )}
                </div>
                {p.caption && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/85">{p.caption}</p>
                )}
              </div>

              {/* Sağ: Reels tarzı aksiyon yığını */}
              <div className="absolute bottom-0 right-2 flex flex-col items-center gap-5 p-1 pb-28">
                <GolgeLikeButton
                  postId={p.id}
                  initialLiked={likedIds.has(p.id)}
                  initialCount={p.like_count}
                />
                <Link
                  href={`/golge/${p.id}`}
                  className="flex flex-col items-center gap-1 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                >
                  <ChatIcon className="h-7 w-7" />
                  <span className="text-xs font-semibold">{p.comment_count}</span>
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      {/* Sonsuz yükleme tetikleyici */}
      {hasMore && <div ref={sentinelRef} className="h-px w-full" />}
    </div>
  );
}
