"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { bumpMyTask } from "@/lib/tasks";
import { PLANS, PLUS_PERKS } from "@/lib/payments/plans";
import { CrownIcon, SparkIcon } from "@/components/ui/icons";
import type { SubscriptionType } from "@/types";

export default function PlusPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionType | null>(null);

  const isPlus = profile?.is_plus ?? false;

  // Plus ziyaret görevi
  useEffect(() => {
    if (user) bumpMyTask("visit_plus");
  }, [user]);

  // Ödeme dönüşü (?status=success|failed)
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") {
      success("Ödeme başarılı! Anonix Plus aktif 👑");
      refreshProfile();
      window.history.replaceState({}, "", "/plus");
    } else if (status === "failed") {
      toastError("Ödeme tamamlanamadı. Tekrar deneyebilirsin.");
      window.history.replaceState({}, "", "/plus");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buy(type: SubscriptionType) {
    if (!user) {
      router.push("/login");
      return;
    }
    setLoadingPlan(type);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const res = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: type }),
      });
      const data = await res.json();
      if (!res.ok || !data.paymentPageUrl) {
        toastError(data.error || "Ödeme başlatılamadı.");
        setLoadingPlan(null);
        return;
      }
      // iyzico ödeme sayfasına yönlendir
      window.location.href = data.paymentPageUrl;
    } catch {
      toastError("Bir hata oluştu. Lütfen tekrar dene.");
      setLoadingPlan(null);
    }
  }

  return (
    <Container>
      <div className="py-4">
        {/* Başlık */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-brand-600 via-brand-800 to-ink-900 p-8 text-center shadow-glow">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-300/20 blur-3xl" />
          <div className="relative">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-glow">
              <CrownIcon className="h-7 w-7 text-ink-900" />
            </span>
            <h1 className="text-3xl font-extrabold text-white">Anonix Plus</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/80">
              Premium özelliklerle deneyimini bir üst seviyeye taşı.
            </p>
            {isPlus && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-5 py-2.5 text-sm font-bold text-amber-200">
                <CrownIcon className="h-4 w-4" />
                Plus üyesin
                {profile?.plus_expires_at && (
                  <span className="font-normal text-amber-100/70">
                    · {new Date(profile.plus_expires_at).toLocaleDateString("tr-TR")} tarihine kadar
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pricing kartları */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["monthly", "yearly"] as SubscriptionType[]).map((type) => {
            const plan = PLANS[type];
            return (
              <div
                key={type}
                className={`relative rounded-2xl border p-6 ${
                  plan.popular
                    ? "border-amber-400/40 bg-gradient-to-br from-brand-700/40 to-ink-900 shadow-glow"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-900">
                    En popüler
                  </span>
                )}
                <p className="text-sm font-semibold text-slate-300">{plan.name}</p>
                <p className="mt-2 text-3xl font-extrabold text-white">
                  ₺{plan.price.toFixed(2)}
                  <span className="text-sm font-medium text-slate-400">
                    {type === "monthly" ? " /ay" : " /yıl"}
                  </span>
                </p>
                {type === "yearly" && (
                  <p className="mt-1 text-xs text-emerald-300">Aylığa göre avantajlı</p>
                )}

                <button
                  onClick={() => buy(type)}
                  disabled={loadingPlan !== null || isPlus}
                  className={`mt-4 w-full rounded-full px-6 py-3 text-sm font-bold transition-transform active:scale-95 disabled:opacity-60 ${
                    plan.popular
                      ? "bg-gradient-to-r from-amber-300 to-amber-500 text-ink-900 shadow-glow"
                      : "bg-brand-gradient text-white"
                  }`}
                >
                  {isPlus
                    ? "Zaten Plus üyesin"
                    : loadingPlan === type
                      ? "Yönlendiriliyor..."
                      : "Satın al"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Avantajlar */}
        <h2 className="mb-3 mt-8 text-lg font-bold text-white">Plus avantajları</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PLUS_PERKS.map((perk) => (
            <div key={perk} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-4 py-3">
              <SparkIcon className="h-4 w-4 shrink-0 text-amber-300" />
              <span className="text-sm text-slate-200">{perk}</span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Ödemeler iyzico güvencesiyle alınır. Kart bilgilerin Anonix sunucularında saklanmaz.
        </p>
      </div>
    </Container>
  );
}
