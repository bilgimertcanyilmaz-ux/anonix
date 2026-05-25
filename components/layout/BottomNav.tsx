"use client";

import Link from "next/link";
import {
  HomeIcon,
  CompassIcon,
  PlusCircleIcon,
  ChatIcon,
  UserIcon,
  MoonIcon,
} from "@/components/ui/icons";
import { useUnread } from "@/components/messages/UnreadProvider";

const items = [
  { href: "/", label: "Ana", Icon: HomeIcon },
  { href: "/confessions", label: "Keşfet", Icon: CompassIcon },
  { href: "/golge", label: "Gölge", Icon: MoonIcon },
  { href: "/confessions/new", label: "İtiraf", Icon: PlusCircleIcon, highlight: true },
  { href: "/messages", label: "Mesaj", Icon: ChatIcon, badge: true },
  { href: "/profile", label: "Profil", Icon: UserIcon },
];

/** Mobil alt navigasyon çubuğu (yalnızca küçük ekranlarda görünür). */
export function BottomNav() {
  const { unreadCount } = useUnread();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink-950/85 backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {items.map(({ href, label, Icon, highlight, badge }) => (
          <li key={href}>
            <Link
              href={href}
              aria-label={label}
              className="flex flex-col items-center gap-1 px-2 py-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-white"
            >
              {highlight ? (
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient shadow-glow">
                  <Icon className="h-6 w-6 text-white" />
                </span>
              ) : (
                <span className="relative">
                  <Icon className="h-6 w-6" />
                  {badge && unreadCount > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              )}
              <span className={highlight ? "text-brand-200" : ""}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
