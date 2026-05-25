import Link from "next/link";
import {
  HomeIcon,
  CompassIcon,
  PlusCircleIcon,
  ChatIcon,
  UserIcon,
} from "@/components/ui/icons";

const items = [
  { href: "/", label: "Ana Sayfa", Icon: HomeIcon },
  { href: "/confessions", label: "Keşfet", Icon: CompassIcon },
  { href: "/confessions/new", label: "İtiraf Yaz", Icon: PlusCircleIcon, highlight: true },
  { href: "/messages", label: "Mesaj", Icon: ChatIcon },
  { href: "/profile", label: "Profil", Icon: UserIcon },
];

/** Mobil alt navigasyon çubuğu (yalnızca küçük ekranlarda görünür). */
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-ink-950/85 backdrop-blur-md md:hidden">
      <ul className="mx-auto flex max-w-2xl items-center justify-around px-2 py-2">
        {items.map(({ href, label, Icon, highlight }) => (
          <li key={href}>
            <Link
              href={href}
              aria-label={label}
              className="flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-white"
            >
              {highlight ? (
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-gradient shadow-glow">
                  <Icon className="h-6 w-6 text-white" />
                </span>
              ) : (
                <Icon className="h-6 w-6" />
              )}
              <span className={highlight ? "text-brand-200" : ""}>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
