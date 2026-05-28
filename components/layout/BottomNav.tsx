"use client";

import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  CompassIcon,
  PlusCircleIcon,
  ChatIcon,
  UserIcon,
  MoonIcon,
} from "@/components/ui/icons";
import { useUnread } from "@/components/messages/UnreadProvider";

/** Bulunulan sayfanın ilgili nav öğesini aktif sayar (alt rotalar dahil). */
function matchActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/confessions/new") return false;
  if (href === "/confessions")
    return pathname.startsWith("/confessions/") && pathname !== "/confessions/new";
  return pathname.startsWith(href + "/");
}

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  highlight?: boolean;
  badge?: boolean;
};

const items: NavItem[] = [
  { href: "/confessions", label: "Keşfet", Icon: CompassIcon },
  { href: "/golge", label: "Gölge", Icon: MoonIcon },
  { href: "/confessions/new", label: "İtiraf", Icon: PlusCircleIcon, highlight: true },
  { href: "/messages", label: "Mesajlar", Icon: ChatIcon, badge: true },
  { href: "/profile", label: "Profil", Icon: UserIcon },
];

/**
 * Floating dock bottom navigation — premium iOS-style.
 * Pill container, neon-glow center button, glass blur, safe-area destekli.
 */
export function BottomNav() {
  const { unreadCount } = useUnread();
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden"
      aria-label="Ana mobil navigasyon"
    >
      <ul className="anonix-dock flex items-center gap-1 rounded-full border border-white/10 bg-ink-950/70 px-2 py-1.5 shadow-premium-md backdrop-blur-xl">
        {items.map(({ href, label, Icon, highlight, badge }) => {
          const active = matchActive(pathname, href);
          if (highlight) {
            return (
              <li key={href} className="px-1">
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className="relative -my-3 flex h-14 w-14 items-center justify-center"
                >
                  <span
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-neon-purple text-white shadow-glow ${
                      active ? "animate-pulse-glow" : ""
                    }`}
                  >
                    {/* Inner ring highlight */}
                    <span className="pointer-events-none absolute inset-0 rounded-full shadow-inset-glow" />
                    <Icon className="relative h-7 w-7 drop-shadow-[0_2px_8px_rgba(124,58,237,0.6)]" />
                  </span>
                </Link>
              </li>
            );
          }
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-full text-[10px] transition-colors duration-200 ${
                  active ? "text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <span className="relative">
                  {active && (
                    <motion.span
                      layoutId="bottomNavActive"
                      transition={{ type: "spring", stiffness: 360, damping: 28 }}
                      className="absolute inset-[-10px] -z-10 rounded-full bg-brand-500/25 blur-md"
                    />
                  )}
                  <Icon className="h-6 w-6" />
                  {badge && unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 px-1 text-[9px] font-bold text-white shadow-glow-sm ring-2 ring-ink-950">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
