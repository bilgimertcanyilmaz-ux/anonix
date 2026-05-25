import Link from "next/link";
import { ShieldIcon } from "@/components/ui/icons";

const points = [
  { icon: "🔒", title: "Gerçek anonimlik", desc: "Kimliğin senin kontrolünde; istediğinde tamamen gizli kal." },
  { icon: "🛡️", title: "Aktif moderasyon", desc: "Kişisel bilgi, tehdit ve hakaret otomatik olarak engellenir." },
  { icon: "🚩", title: "Tek tıkla şikayet", desc: "Rahatsız edici içeriği bildir; ekibimiz hızla inceler." },
];

/** Güvenli anonimlik + moderasyon vurgusu. */
export function SafetyTeaser() {
  return (
    <section className="animate-fade-up py-6">
      <div className="mb-4 flex items-center gap-2">
        <ShieldIcon className="h-5 w-5 text-brand-300" />
        <h2 className="text-lg font-bold text-white">Güvenli ve saygılı topluluk</h2>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {points.map((p) => (
          <div key={p.title} className="card p-4">
            <span className="text-2xl">{p.icon}</span>
            <p className="mt-2 text-sm font-semibold text-white">{p.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">{p.desc}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Daha fazlası için{" "}
        <Link href="/community-rules" className="text-brand-300 hover:text-brand-200">
          Topluluk Kuralları
        </Link>{" "}
        ve{" "}
        <Link href="/safety" className="text-brand-300 hover:text-brand-200">
          Güvenlik Merkezi
        </Link>
        .
      </p>
    </section>
  );
}
