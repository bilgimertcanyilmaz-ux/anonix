import Link from "next/link";
import { MaskIcon } from "@/components/ui/icons";
import { siteConfig } from "@/lib/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-white/5 bg-ink-950/40">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient">
            <MaskIcon className="h-4 w-4 text-white" />
          </span>
          <span className="text-base font-extrabold text-white">
            Anon<span className="text-gradient">ix</span>
          </span>
        </div>
        <p className="mt-3 max-w-sm text-xs leading-relaxed text-slate-500">
          {siteConfig.slogan} Güvenli, moderasyonlu ve anonim sosyal platform.
        </p>

        <nav className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
          {siteConfig.footerLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <p className="mt-6 text-xs text-slate-600">
          © {year} Anonix. Tüm hakları saklıdır.
        </p>
      </div>
    </footer>
  );
}
