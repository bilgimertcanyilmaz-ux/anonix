import type { ConfessionAuthor } from "@/types";
import { genderFrameClass, initialsOf } from "@/lib/profile";
import { MaskIcon } from "@/components/ui/icons";

interface AuthorBadgeProps {
  /** İtiraf/yorumun anonim paylaşılıp paylaşılmadığı. */
  anonymous: boolean;
  author?: ConfessionAuthor | null;
  /** Avatar altındaki ikincil metin (örn. tarih). */
  subtitle?: string;
  size?: "sm" | "md";
}

/** İtiraf/yorum kartlarında yazar kimliğini gösterir (anonimse gizler). */
export function AuthorBadge({
  anonymous,
  author,
  subtitle,
  size = "md",
}: AuthorBadgeProps) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  const showName = !anonymous && author?.username;

  return (
    <div className="flex items-center gap-3">
      {showName ? (
        <div
          className={`flex items-center justify-center rounded-full p-[2px] ${genderFrameClass[author!.gender]}`}
        >
          <div
            className={`flex items-center justify-center rounded-full bg-ink-900 font-bold text-white ${dim}`}
          >
            {initialsOf(author!.username)}
          </div>
        </div>
      ) : (
        <div
          className={`flex items-center justify-center rounded-full bg-white/10 text-slate-300 ${dim}`}
        >
          <MaskIcon className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {showName ? `@${author!.username}` : "Anonim Kullanıcı"}
        </p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </div>
  );
}
