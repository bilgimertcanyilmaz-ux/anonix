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
 * Aktif öğe: kayan gradyan pill + etiket. Orta buton: dönen ışık halkalı FAB.
 */
export function BottomNav() {
  const { unreadCount } = useUnread();
  const pathname = usePathname() ?? "/";

  // Sohbet ekranında dock gizlenir: yazma alanı alt kenara oturur,
  // klavye açıkken araya boşluk/çift katman girmez.
  if (/^\/messages\/[^/]+$/.test(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 md:hidden"
      aria-label="Ana mobil navigasyon"
    >
      <ul
        className="anonix-dock relative flex items-center gap-0.5 rounded-full border border-white/10 bg-ink-950/75 px-2 py-1.5 backdrop-blur-xl"
        style={{
          boxShadow:
            "0 12px 40px -10px rgba(124,58,237,0.45), 0 4px 16px -6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {items.map(({ href, label, Icon, highlight, badge }) => {
          const active = matchActive(pathname, href);

          /* ── Orta FAB: İtiraf Yaz ── */
          if (highlight) {
            return (
              <li key={href} className="px-1.5">
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? "page" : undefined}
                  className="relative -my-4 block"
                >
                  <motion.span whileTap={{ scale: 0.9 }} className="relative flex h-14 w-14 items-center justify-center">
                    {/* Dönen ışık halkası */}
                    <motion.span
                      aria-hidden
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-[3px] rounded-full opacity-90"
                      style={{
                        background:
                          "conic-gradient(from 0deg, transparent 0%, rgba(236,72,153,0.9) 18%, transparent 40%, rgba(168,85,247,0.9) 65%, transparent 90%)",
                        padding: "2px",
                        WebkitMask:
                          "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                        WebkitMaskComposite: "xor",
                        maskComposite: "exclude",
                      }}
                    />
                    {/* Nefes alan dış halo */}
                    <motion.span
                      aria-hidden
                      animate={{ opacity: [0.35, 0.7, 0.35], scale: [1, 1.12, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full blur-md"
                      style={{ background: "rgba(168,85,247,0.5)" }}
                    />
                    <span
                      className="relative flex h-14 w-14 items-center justify-center rounded-full"
                      style={{
                        background: "linear-gradient(135deg, #ec4899 0%, #a855f7 55%, #7c3aed 100%)",
                        color: "#fff",
                        boxShadow:
                          "0 8px 24px -6px rgba(168,85,247,0.7), inset 0 1.5px 0 rgba(255,255,255,0.35)",
                      }}
                    >
                      <Icon className="h-7 w-7 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]" />
                    </span>
                  </motion.span>
                </Link>
              </li>
            );
          }

          /* ── Normal öğeler: aktifte gradyan pill + etiket ── */
          return (
            <motion.li
              key={href}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-11 items-center justify-center rounded-full ${
                  active ? "gap-1.5 px-3.5" : "w-11"
                }`}
                style={{ color: active ? "#fff" : undefined }}
              >
                {active && (
                  <motion.span
                    layoutId="bottomNavActive"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, rgba(168,85,247,0.95), rgba(124,58,237,0.95))",
                      boxShadow: "0 4px 16px -4px rgba(168,85,247,0.6), inset 0 1px 0 rgba(255,255,255,0.25)",
                    }}
                  />
                )}
                <span
                  className={`relative ${active ? "" : "text-slate-400 transition-colors hover:text-white"}`}
                  style={active ? { color: "#fff" } : undefined}
                >
                  <Icon className="h-[22px] w-[22px]" />
                  {badge && unreadCount > 0 && (
                    <span
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ring-2 ring-ink-950"
                      style={{
                        background: "linear-gradient(135deg, #f472b6, #ec4899)",
                        color: "#fff",
                        boxShadow: "0 0 8px rgba(236,72,153,0.7)",
                      }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                {active && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 }}
                    className="relative whitespace-nowrap text-[11px] font-bold"
                    style={{ color: "#fff" }}
                  >
                    {label}
                  </motion.span>
                )}
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </nav>
  );
}
