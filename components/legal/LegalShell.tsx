import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

interface LegalShellProps {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}

/** Yasal / bilgilendirme sayfaları için ortak, okunabilir kabuk. */
export function LegalShell({ title, subtitle, updated, children }: LegalShellProps) {
  return (
    <Container>
      <div className="py-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>}
        {updated && <p className="mt-1 text-xs text-slate-600">Son güncelleme: {updated}</p>}

        <article
          className="mt-6 space-y-4 [&_a]:text-brand-300 [&_a:hover]:text-brand-200 [&_h2]:mt-7 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-slate-300 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-300 [&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5"
        >
          {children}
        </article>
      </div>
    </Container>
  );
}
