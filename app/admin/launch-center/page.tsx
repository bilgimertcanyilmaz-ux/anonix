const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "Store hazırlığı",
    items: [
      "Native sarmalama (Play TWA / App Store Capacitor)",
      "Uygulama adı, açıklama, anahtar kelimeler (ASO)",
      "Yaş derecesi: 17+ / Mature",
      "Gizlilik politikası + veri güvenliği formları",
    ],
  },
  {
    title: "Screenshot checklist",
    items: [
      "Keşfet, Gölge, Profil, Onboarding ekran görüntüleri",
      "iOS 1290×2796 · Android 1080×1920",
      "/marketing/store-assets çerçevelerini kullan",
    ],
  },
  {
    title: "Logo checklist",
    items: ["Favicon (app/icon.png)", "iOS apple-icon", "PWA 192/512 + maskable", "Optimize boyut"],
  },
  {
    title: "Moderation checklist",
    items: [
      "/admin/pending acil inceleme kuyruğu",
      "24 saat içinde aksiyon süreci",
      "Yasaklı kelime listesi güncel",
      "Otomatik gizleme (3 şikayet) aktif",
    ],
  },
  {
    title: "Support email checklist",
    items: ["İletişim sayfası çalışıyor", "Destek e-postası tanımlı", "Şikayet yanıt süreci"],
  },
  {
    title: "Analytics checklist",
    items: [
      "analytics_events tablosu kurulu",
      "/admin/analytics çalışıyor",
      "Install/onboarding/referral/push olayları bağlı",
    ],
  },
  {
    title: "Push notification checklist",
    items: [
      "İzin butonu (profil)",
      "push_subscriptions tablosu",
      "(İleride) VAPID + SW push event",
    ],
  },
];

/** Launch merkezi — statik kontrol listesi (operasyonel hatırlatıcı). */
export default function LaunchCenterPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Launch Center</h2>
        <p className="text-xs text-slate-400">Yayın öncesi operasyonel kontrol listesi.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="card p-4">
            <h3 className="mb-2 text-sm font-bold text-brand-200">{sec.title}</h3>
            <ul className="space-y-1.5">
              {sec.items.map((it) => (
                <li key={it} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="mt-0.5 text-brand-400">▢</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-slate-500">
        Detaylı plan: <code className="text-brand-300">docs/LAUNCH_PLAN.md</code>
      </p>
    </div>
  );
}
