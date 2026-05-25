import type { ConfessionAuthor } from "@/types";
import { UserIdentity } from "@/components/UserIdentity";

interface AuthorBadgeProps {
  /** İtiraf/yorumun anonim paylaşılıp paylaşılmadığı (içeriğin kendi değeri). */
  anonymous: boolean;
  author?: ConfessionAuthor | null;
  /** Avatar altındaki ikincil metin (örn. tarih). */
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * İtiraf/yorum/Gölge kartlarında yazar kimliğini gösterir.
 * Anonimse kullanıcı adı gizlenir; cinsiyet her zaman (çerçeve + rozet) görünür.
 */
export function AuthorBadge({ anonymous, author, subtitle, size = "md" }: AuthorBadgeProps) {
  return (
    <UserIdentity
      username={author?.username}
      gender={author?.gender}
      isAnonymous={anonymous}
      subtitle={subtitle}
      size={size}
      showGender
      showUsername
    />
  );
}
