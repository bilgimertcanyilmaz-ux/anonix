import { LinkButton } from "@/components/ui/Button";
import { SparkIcon } from "@/components/ui/icons";

const perks = [
  "Özel mesajlaşma",
  "Premium profil çerçevesi",
  "Reklamsız deneyim",
  "Öne çıkan itiraflar",
];

/** Plus (premium) üyelik ön tanıtım bölümü. */
export function PlusTeaser() {
  return (
    <section className="animate-fade-up py-6">
      <div className="relative overflow-hidden rounded-2xl border border-brand-500/30 bg-brand-gradient p-6 shadow-glow">
        {/* Dekoratif ışıma */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
            <SparkIcon className="h-3.5 w-3.5" />
            Anonix Plus
          </span>

          <h2 className="mt-3 text-2xl font-extrabold text-white">
            Daha fazlasının kilidini aç
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/80">
            Premium özelliklerle deneyimini bir üst seviyeye taşı. Çok yakında.
          </p>

          <ul className="mt-4 grid grid-cols-2 gap-2">
            {perks.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-2 text-sm font-medium text-white/90"
              >
                <span className="text-white">✦</span>
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <LinkButton
              href="/plus"
              variant="ghost"
              className="border-white/30 bg-white/15 text-white hover:bg-white/25"
            >
              Plus'ı keşfet
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
