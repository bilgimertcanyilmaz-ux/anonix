import type { Gender } from "@/types";
import { getGenderFrameClass } from "@/lib/gender";
import { initialsOf } from "@/lib/profile";
import { AnonymousAvatar } from "@/components/AnonymousAvatar";

type Size = "sm" | "md" | "lg";

const OUTER: Record<Size, string> = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-20 w-20",
};
const TEXT: Record<Size, string> = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

/**
 * Cinsiyete göre çerçeveli avatar (büyük profil başlıkları için).
 * - anonymous: maske ikonu (kimlik gizli) — cinsiyet çerçevesi yine de görünür
 * - açık: avatar görseli ya da baş harfler
 */
export function ProfileFrame({
  gender,
  username,
  avatarUrl,
  anonymous = false,
  isPlus = false,
  size = "lg",
}: {
  gender: Gender | string | null | undefined;
  username?: string | null;
  avatarUrl?: string | null;
  anonymous?: boolean;
  isPlus?: boolean;
  size?: Size;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full p-[3px] ${OUTER[size]} ${getGenderFrameClass(gender)} ${isPlus ? "shadow-glow ring-2 ring-amber-300/70" : ""}`}
    >
      <div
        className={`flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-ink-900 font-bold text-white ${TEXT[size]}`}
      >
        {!anonymous && avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={username ?? "Profil"} className="h-full w-full object-cover" />
        ) : !anonymous && username ? (
          initialsOf(username)
        ) : (
          <AnonymousAvatar />
        )}
      </div>
    </div>
  );
}
