import Link from "next/link";
import type { Gender } from "@/types";
import { getGenderLabel, getGenderFrameClass, getGenderBadgeClass } from "@/lib/gender";
import { MaskIcon } from "@/components/ui/icons";

type Size = "sm" | "md" | "lg";

interface UserIdentityProps {
  username?: string | null;
  gender: Gender | string | null | undefined;
  avatarUrl?: string | null;
  /** Paylaşımın/yorumun anonim olup olmadığı (profilin değil, içeriğin kendi değeri). */
  isAnonymous: boolean;
  size?: Size;
  /** Cinsiyet rozetini göster (anonim olsa bile cinsiyet her zaman görünebilir). */
  showGender?: boolean;
  /** Anonim değilse kullanıcı adını göster. */
  showUsername?: boolean;
  /** Avatar yanındaki ikincil metin (örn. tarih). */
  subtitle?: string;
  /**
   * Verilirse VE kullanıcı anonim değilse, kimlik bu adrese link olur.
   * Anonim kullanıcılar tıklanamaz (kimlik gizli kalır).
   * Dış sarmalayıcı zaten bir <a>/Link ise (örn. mesaj listesi) bu propu GEÇMEYİN.
   */
  profileHref?: string;
}

const AVATAR: Record<Size, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

const NAME_TEXT: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};

function initialsOf(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

/**
 * Tüm yüzeylerde tutarlı kullanıcı kimliği gösterimi.
 * - Cinsiyet çerçevesi HER ZAMAN uygulanır (anonim olsa bile).
 * - Cinsiyet rozeti showGender ile her zaman gösterilebilir.
 * - Anonimse kullanıcı adı gizlenir ("Anonim Kullanıcı"), cinsiyet gizlenmez.
 */
export function UserIdentity({
  username,
  gender,
  avatarUrl,
  isAnonymous,
  size = "md",
  showGender = true,
  showUsername = true,
  subtitle,
  profileHref,
}: UserIdentityProps) {
  const revealName = !isAnonymous && showUsername && !!username;
  const displayName = revealName ? `@${username}` : "Anonim Kullanıcı";
  const frame = getGenderFrameClass(gender);
  // Yalnızca kimlik açıkken link olur; anonim kullanıcı tıklanamaz.
  const linkable = !!profileHref && revealName;

  const inner = (
    <>
      {/* Cinsiyet çerçeveli avatar (her zaman çerçeveli) */}
      <div className={`flex shrink-0 items-center justify-center rounded-full p-[2px] ${frame}`}>
        <div
          className={`flex items-center justify-center overflow-hidden rounded-full bg-ink-900 font-bold text-white ${AVATAR[size]}`}
        >
          {revealName && avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : revealName && username ? (
            initialsOf(username)
          ) : (
            <MaskIcon className="h-1/2 w-1/2 text-slate-300" />
          )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={`truncate font-semibold text-white ${NAME_TEXT[size]}`}>{displayName}</p>
          {showGender && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getGenderBadgeClass(gender)}`}
            >
              {getGenderLabel(gender)}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </>
  );

  if (linkable) {
    return (
      <Link href={profileHref!} className="flex items-center gap-3 transition-opacity hover:opacity-80">
        {inner}
      </Link>
    );
  }
  return <div className="flex items-center gap-3">{inner}</div>;
}
