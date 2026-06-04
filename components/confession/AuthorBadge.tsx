import type { ConfessionAuthor } from "@/types";
import { UserIdentity } from "@/components/UserIdentity";

interface AuthorBadgeProps {
  /** İtiraf/yorumun anonim paylaşılıp paylaşılmadığı (içeriğin kendi değeri). */
  anonymous: boolean;
  author?: ConfessionAuthor | null;
  /** Avatar altındaki ikincil metin (örn. tarih). */
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  /** Açık yazarı /users/[username] profiline bağla (varsayılan açık). */
  linkProfile?: boolean;
}

/**
 * İtiraf/yorum/Gölge kartlarında yazar kimliğini gösterir.
 * Anonimse kullanıcı adı gizlenir; cinsiyet her zaman (çerçeve + rozet) görünür.
 * Anonim olmayan yazar varsayılan olarak açık profiline linklenir.
 */
export function AuthorBadge({ anonymous, author, subtitle, size = "md", linkProfile = true }: AuthorBadgeProps) {
  const profileHref =
    linkProfile && !anonymous && author?.username ? `/users/${author.username}` : undefined;
  return (
    <UserIdentity
      username={author?.username}
      gender={author?.gender}
      avatarUrl={author?.avatar_url}
      premiumTheme={author?.premium_theme}
      isAnonymous={anonymous}
      subtitle={subtitle}
      size={size}
      showGender
      showUsername
      profileHref={profileHref}
    />
  );
}
