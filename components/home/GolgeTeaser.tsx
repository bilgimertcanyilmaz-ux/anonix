import { LinkButton } from "@/components/ui/Button";
import { MoonIcon } from "@/components/ui/icons";

/** Gölge (fotoğraflı paylaşım) özelliğini tanıtan bölüm. */
export function GolgeTeaser() {
  return (
    <section className="animate-fade-up py-6">
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-ink-700 to-ink-900 p-6">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-500/15 blur-2xl" />
        <div className="relative">
          <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-200">
            <MoonIcon className="h-6 w-6" />
          </span>
          <h2 className="text-xl font-bold text-white">Gölge — fotoğrafla anlat</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            Bir fotoğraf, üzerine birkaç kelime. Neon, glitch veya minimal stillerle
            görselinin üstüne yazını ekle; keşfet akışından ayrı, gizemli bir akışta
            paylaş. İstersen tamamen anonim.
          </p>
          <div className="mt-5">
            <LinkButton href="/golge" variant="ghost">
              Gölge'yi keşfet
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
