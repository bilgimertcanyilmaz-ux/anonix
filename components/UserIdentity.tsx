import Link from "next/link";
import type { Gender } from "@/types";
import { getGenderLabel, getGenderFrameClass, getGenderBadgeClass } from "@/lib/gender";
import { getPremiumTheme } from "@/lib/themes";
import { FramedAvatar } from "@/components/profile/FramedAvatar";
import { AnonymousAvatar } from "@/components/AnonymousAvatar";

type Size = "sm" | "md" | "lg";

/** Premium çerçeve gösterildiğinde kullanılan kare kutu boyutu (px). */
const FRAME_BOX: Record<Size, number> = {
  sm: 46,
  md: 58,
  lg: 78,
};

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
  /** Yazarın premium rütbe çerçevesi (anonim değilse avatar etrafında gösterilir). */
  premiumTheme?: string | null;
  /** Abonelik paketi — cinsiyet rozetinin yanında PLUS/ULTRA rozeti gösterir. */
  tier?: "free" | "plus" | "ultra_plus" | null;
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
  premiumTheme,
  tier,
  subtitle,
  profileHref,
}: UserIdentityProps) {
  const revealName = !isAnonymous && showUsername && !!username;
  const displayName = revealName ? `@${username}` : "Anonim Kullanıcı";
  const frame = getGenderFrameClass(gender);
  // Yalnızca kimlik açıkken link olur; anonim kullanıcı tıklanamaz.
  const linkable = !!profileHref && revealName;
  // Premium çerçeve yalnızca kimlik açıkken gösterilir (anonimde gizli kalır).
  const theme = revealName ? getPremiumTheme(premiumTheme) : null;

  const avatar =
    theme ? (
      // Premium rütbe çerçeveli avatar — her yüzeyde tutarlı.
      <FramedAvatar themeId={premiumTheme} size={FRAME_BOX[size]} className="shrink-0">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink-900 text-xs font-bold text-white">
            {username ? initialsOf(username) : ""}
          </div>
        )}
      </FramedAvatar>
    ) : (
      // Cinsiyet çerçeveli avatar (premium çerçeve yoksa / anonimde)
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
            <AnonymousAvatar />
          )}
        </div>
      </div>
    );

  const inner = (
    <>
      {avatar}

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
          {tier === "ultra_plus" ? (
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-900">
              Ultra
            </span>
          ) : tier === "plus" ? (
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-400 to-brand-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              Plus
            </span>
          ) : null}
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
