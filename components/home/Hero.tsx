import { LinkButton } from "@/components/ui/Button";
import { CompassIcon, SparkIcon } from "@/components/ui/icons";

/** Ana sayfa kahraman (hero) bölümü. */
export function Hero() {
  return (
    <section className="animate-fade-up py-8 text-center sm:py-12">
      <span className="chip mx-auto mb-5">
        <SparkIcon className="h-3.5 w-3.5 text-brand-300" />
        Tamamen anonim · İz bırakmadan
      </span>

      <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
        Anonim kal, <span className="text-gradient">içini dök.</span>
      </h1>

      <p className="mx-auto mt-4 max-w-md text-balance text-base leading-relaxed text-slate-400">
        Kim olduğunu söylemeden itiraf et, keşfet, tepki al.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <LinkButton href="/confessions" variant="primary" className="w-full sm:w-auto">
          <CompassIcon className="h-4 w-4" />
          İtirafları Keşfet
        </LinkButton>
        <LinkButton href="/register" variant="ghost" className="w-full sm:w-auto">
          Hemen Katıl
        </LinkButton>
      </div>
    </section>
  );
}
