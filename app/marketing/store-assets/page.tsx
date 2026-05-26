import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { slogans } from "@/lib/slogans";

export const metadata: Metadata = {
  title: "Store Görselleri",
  robots: { index: false, follow: false },
};

const FEATURES = [
  { icon: "🎭", title: "Anonim İtiraf", desc: "Kim olduğunu söylemeden paylaş." },
  { icon: "🌙", title: "Gölge", desc: "Fotoğrafla anlat, gölgede kal." },
  { icon: "💬", title: "Plus Mesaj", desc: "Anonim özel mesajlaşma." },
  { icon: "🏆", title: "Rütbe & Streak", desc: "Etkileşimle yüksel." },
  { icon: "🛡️", title: "Güvenli", desc: "Moderasyon + engelleme + şikayet." },
  { icon: "🔥", title: "Keşfet", desc: "Kişiselleştirilmiş, trend akış." },
];

const SHOTS = [
  { label: "Keşfet akışı", hint: "/confessions ekran görüntüsü" },
  { label: "Gölge keşfet", hint: "/golge ekran görüntüsü" },
  { label: "Profil + rütbe", hint: "/profile ekran görüntüsü" },
  { label: "Onboarding", hint: "/onboarding ekran görüntüsü" },
];

/** Mağaza görselleri ve sunum öğeleri için hazırlık sayfası (noindex). */
export default function StoreAssetsPage() {
  return (
    <Container>
      <div className="space-y-8 py-6">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold text-gradient">Anonix · Store Assets</h1>
          <p className="mt-2 text-sm text-slate-400">
            App Store / Play Store sunumu için görsel ve metin öğeleri.
          </p>
        </header>

        {/* Sloganlar */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Sloganlar</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {slogans.map((s) => (
              <div key={s} className="card p-4 text-center text-sm font-semibold text-brand-100">
                “{s}”
              </div>
            ))}
          </div>
        </section>

        {/* Telefon mockup screenshot alanları */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Ekran Görüntüsü Alanları (9:19.5)</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SHOTS.map((shot) => (
              <div key={shot.label} className="space-y-2">
                <div className="mx-auto flex aspect-[9/19.5] w-full items-center justify-center rounded-[2rem] border-4 border-ink-700 bg-app-gradient p-2 text-center">
                  <span className="text-[11px] text-slate-500">{shot.hint}</span>
                </div>
                <p className="text-center text-xs font-medium text-slate-300">{shot.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-500">
            Gerçek cihaz görüntülerini bu çerçevelere yerleştirip dışa aktarın (1290×2796 / 1080×1920).
          </p>
        </section>

        {/* Feature kartları */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Özellik Kartları</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card flex flex-col items-center gap-2 p-5 text-center">
                <span className="text-3xl">{f.icon}</span>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Onboarding mockup özeti */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">Onboarding Akışı</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {["Anonim paylaş", "Gölge", "Plus mesaj", "Güvenli topluluk"].map((t, i) => (
              <div key={t} className="card p-4 text-center">
                <p className="text-xs font-bold text-brand-200">Ekran {i + 1}</p>
                <p className="mt-1 text-sm text-white">{t}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
