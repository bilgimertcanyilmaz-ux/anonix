"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CompassIcon,
  PlusCircleIcon,
  BellIcon,
  UserIcon,
  MoonIcon,
} from "@/components/ui/icons";
import { useNotif } from "@/components/notifications/NotifProvider";

/** Bulunulan sayfanın ilgili nav öğesini aktif sayar (alt rotalar dahil). */
function matchActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/confessions/new") return false; // yalnızca tam eşleşme
  if (href === "/confessions")
    return pathname.startsWith("/confessions/") && pathname !== "/confessions/new";
  return pathname.startsWith(href + "/");
}

const items = [
  { href: "/confessions", label: "Keşfet", Icon: CompassIcon },
  { href: "/golge", label: "Gölge", Icon: MoonIcon },
  { href: "/confessions/new", label: "İtiraf", Icon: PlusCircleIcon, highlight: true },
  { href: "/notifications", label: "Bildirim", Icon: BellIcon, badge: true },
  { href: "/profile", label: "Profil", Icon: UserIcon },
];

/** Mobil alt navigasyon çubuğu (yalnızca küçük ekranlarda görünür). */
export function BottomNav() {
  const { unreadCount: notifCount } = useNotif();
  const pathname = usePathname() ?? "/";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink-950/85 backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-2xl items-end px-1 py-2">
        {items.map(({ href, label, Icon, highlight, badge }) => {
          const active = matchActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
                  active && !highlight ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {highlight ? (
                  <span
                    className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient shadow-glow ring-4 ${
                      active ? "ring-brand-400/50" : "ring-ink-950/85"
                    }`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </span>
                ) : (
                  <span className="relative">
                    <Icon className="h-6 w-6" />
                    {badge && notifCount > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink-500 px-1 text-[9px] font-bold text-white">
                        {notifCount > 99 ? "99+" : notifCount}
                      </span>
                    )}
                  </span>
                )}
                <span className={highlight ? "text-brand-200" : ""}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
