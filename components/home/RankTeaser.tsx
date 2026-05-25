import { ranks } from "@/lib/mockData";
import { CrownIcon } from "@/components/ui/icons";

/** Puan & rütbe sistemini tanıtan küçük bölüm. */
export function RankTeaser() {
  return (
    <section className="animate-fade-up py-6">
      <div className="card p-5">
        <div className="mb-4 flex items-center gap-2">
          <CrownIcon className="h-5 w-5 text-brand-300" />
          <h2 className="text-lg font-bold text-white">Puan kazan, rütbe atla</h2>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-slate-400">
          Her itiraf, beğeni ve yorum sana puan kazandırır. Puanların arttıkça
          rütben yükselir ve toplulukta daha çok tanınırsın.
        </p>

        <div className="flex flex-wrap gap-2">
          {ranks.map(({ rank, icon, description }) => (
            <div
              key={rank}
              className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2"
              title={description}
            >
              <span className="text-base">{icon}</span>
              <span className="text-xs font-semibold text-slate-200">{rank}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
