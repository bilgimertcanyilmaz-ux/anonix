import type { Notification } from "@/types";

/** Bildirim tipine göre ikon (emoji). */
export function notificationIcon(type: string): string {
  switch (type) {
    case "confession_like":
    case "golge_like":
      return "❤️";
    case "confession_comment":
    case "golge_comment":
      return "💬";
    case "message":
      return "📩";
    case "follow":
      return "👤";
    case "badge":
      return "🏅";
    case "task_completed":
      return "🎯";
    case "admin_reply":
      return "📣";
    case "profile_view":
      return "👁️";
    default:
      return "🔔";
  }
}

/** Bildirime tıklanınca gidilecek sayfa. */
export function notificationHref(n: Notification): string {
  switch (n.entity_type) {
    case "confession":
      return n.entity_id ? `/confessions/${n.entity_id}` : "/confessions";
    case "golge":
      return n.entity_id ? `/golge/${n.entity_id}` : "/golge";
    case "conversation":
      return n.entity_id ? `/messages/${n.entity_id}` : "/messages";
    case "badge":
      return "/badges";
    case "task":
      return "/tasks";
    case "profile":
      return "/profile/followers";
    default:
      return "/notifications";
  }
}
