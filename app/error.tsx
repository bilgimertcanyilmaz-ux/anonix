"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Anonix] Beklenmeyen hata:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 text-5xl">😕</span>
      <h1 className="text-2xl font-extrabold text-white">Bir şeyler ters gitti</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Beklenmeyen bir hata oluştu. Tekrar deneyebilir ya da ana sayfaya dönebilirsin.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          Tekrar dene
        </button>
        <Link
          href="/"
          className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
        >
          Ana sayfa
        </Link>
      </div>
    </div>
  );
}
