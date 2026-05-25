import type { Badge } from "@/types";

/** Rozetin görsel ikonu (yoksa tipe göre varsayılan). */
export function badgeIcon(badge: Pick<Badge, "icon" | "badge_type">): string {
  if (badge.icon) return badge.icon;
  switch (badge.badge_type) {
    case "points":
      return "⭐";
    case "special":
      return "👑";
    case "rank":
      return "🔥";
    default:
      return "🏅";
  }
}

/** Rozet tipine göre çerçeve rengi sınıfı. */
export function badgeTone(badgeType: string): string {
  switch (badgeType) {
    case "special":
      return "from-amber-300/30 to-amber-500/20 border-amber-400/40";
    case "points":
      return "from-brand-400/30 to-brand-600/20 border-brand-400/40";
    case "rank":
      return "from-orange-400/30 to-red-500/20 border-orange-400/40";
    default:
      return "from-white/10 to-white/5 border-white/15";
  }
}
