import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="text-gradient text-6xl font-extrabold">404</span>
      <h1 className="mt-3 text-2xl font-extrabold text-white">Sayfa bulunamadı</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-full bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform active:scale-95"
        >
          Ana sayfa
        </Link>
        <Link
          href="/confessions"
          className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10"
        >
          Keşfet
        </Link>
      </div>
    </div>
  );
}
