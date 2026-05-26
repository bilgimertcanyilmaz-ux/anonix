import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Kart altında gösterilecek yardımcı bağlantı(lar). */
  footer?: ReactNode;
}

/** Auth sayfaları için ortak, ortalanmış kart kabuğu. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6">
      <div className="card animate-fade-up p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Anonix"
            width={56}
            height={56}
            priority
            className="mb-4 rounded-2xl shadow-glow"
          />
          <h1 className="text-2xl font-extrabold text-white">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
          )}
        </div>

        {children}
      </div>

      {footer && (
        <p className="mt-5 text-center text-sm text-slate-400">{footer}</p>
      )}

      <p className="mt-6 text-center text-xs text-slate-600">
        <Link href="/" className="hover:text-slate-400">
          ← Ana sayfaya dön
        </Link>
      </p>
    </div>
  );
}
