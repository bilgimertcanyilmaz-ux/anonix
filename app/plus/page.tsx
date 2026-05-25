"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { bumpMyTask } from "@/lib/tasks";
import { SparkIcon, ChatIcon, UserIcon, CrownIcon, MaskIcon, HeartIcon } from "@/components/ui/icons";

const perks = [
  { Icon: ChatIcon, title: "Özel mesaj gönderme", desc: "İtiraf sahiplerine doğrudan, gizli mesaj at." },
  { Icon: UserIcon, title: "Profil ziyaretlerini gör", desc: "Profilini kimlerin ziyaret ettiğini keşfet." },
  { Icon: CrownIcon, title: "Özel profil çerçevesi", desc: "Altın tonlu premium çerçeveyle öne çık." },
  { Icon: SparkIcon, title: "Reklamsız kullanım", desc: "Hiçbir kesinti olmadan saf deneyim." },
  { Icon: MaskIcon, title: "Gizli mod", desc: "Kim olduğunu tamamen gizle, izini belli etme." },
  { Icon: HeartIcon, title: "Gelişmiş rozetler", desc: "Sadece Plus üyelere özel rozetlerin kilidini aç." },
];

export default function PlusPage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [activating, setActivating] = useState(false);

  const isPlus = profile?.is_plus ?? false;

  // "Plus sayfasını ziyaret et" günlük görevini ilerlet
  useEffect(() => {
    if (user) bumpMyTask("visit_plus");
  }, [user]);

  async function handleActivate() {
    if (!user) {
      router.push("/login");
      return;
    }
    setActivating(true);
    const result = await updateProfile({ is_plus: true });
    setActivating(false);
    if (result.error) {
      toastError(result.error);
      return;
    }
    await refreshProfile();
    success("Anonix Plus aktifleştirildi! 👑");
  }

  return (
    <Container>
      <div className="py-4">
        {/* Premium başlık */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-brand-600 via-brand-800 to-ink-900 p-8 text-center shadow-glow">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-brand-400/20 blur-3xl" />
          <div className="relative">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-glow">
              <CrownIcon className="h-7 w-7 text-ink-900" />
            </span>
            <h1 className="text-3xl font-extrabold text-white">Anonix Plus</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/80">
              Premium özelliklerle deneyimini bir üst seviyeye taşı. Daha fazla
              bağlantı, daha fazla ayrıcalık.
            </p>

            {isPlus ? (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-5 py-2.5 text-sm font-bold text-amber-200">
                <CrownIcon className="h-4 w-4" />
                Zaten Plus üyesin
              </div>
            ) : (
              <button
                onClick={handleActivate}
                disabled={activating || loading}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-7 py-3 text-sm font-bold text-ink-900 shadow-glow transition-transform active:scale-95 disabled:opacity-60"
              >
                <SparkIcon className="h-4 w-4" />
                {activating ? "Aktifleştiriliyor..." : "Plus'ı Aktifleştir"}
              </button>
            )}
            <p className="mt-3 text-xs text-white/50">
              Geliştirme sürümü — ödeme gerektirmez.
            </p>
          </div>
        </div>

        {/* Avantajlar */}
        <h2 className="mb-4 mt-8 text-lg font-bold text-white">Plus avantajları</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {perks.map(({ Icon, title, desc }) => (
            <div key={title} className="card flex items-start gap-3 p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
