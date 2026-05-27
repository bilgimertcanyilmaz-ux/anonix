"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabaseClient";
import { bumpMyTask } from "@/lib/tasks";
import { PLANS } from "@/lib/payments/plans";
import {
  PLUS_PERKS,
  ULTRA_PERKS,
  COMPARISON_ROWS,
  getEffectiveTier,
  TIER_LABELS,
} from "@/lib/subscription";
import { CrownIcon, SparkIcon } from "@/components/ui/icons";
import type { SubscriptionType } from "@/types";

export default function PlusPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionType | null>(null);

  const tier = getEffectiveTier(profile);
  const isUltra = tier === "ultra_plus";

  useEffect(() => {
    if (user) bumpMyTask("visit_plus");
  }, [user]);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") {
      success("Ödeme başarılı! Aboneliğin aktif 👑");
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
      window.location.href = data.paymentPageUrl;
    } catch {
      toastError("Bir hata oluştu. Lütfen tekrar dene.");
      setLoadingPlan(null);
    }
  }

  const plus = PLANS.plus_monthly;
  const ultra = PLANS.ultra_plus_monthly;

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
            <h1 className="text-3xl font-extrabold text-white">Anonix Premium</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/80">
              Sana uygun paketi seç, deneyimini bir üst seviyeye taşı.
            </p>
            {tier !== "free" && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-5 py-2.5 text-sm font-bold text-amber-200">
                <CrownIcon className="h-4 w-4" />
                {TIER_LABELS[tier]} üyesin
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
          {/* PLUS */}
          <div className="relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-200">Plus</p>
            <p className="mt-2 text-3xl font-extrabold text-white">
              ₺{plus.price.toFixed(2)}
              <span className="text-sm font-medium text-slate-400"> /ay</span>
            </p>
            <ul className="mt-4 flex-1 space-y-2">
              {PLUS_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-slate-200">
                  <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" />
                  {perk}
                </li>
              ))}
            </ul>
            <button
              onClick={() => buy("plus_monthly")}
              disabled={loadingPlan !== null || tier === "plus" || isUltra}
              className="mt-5 w-full rounded-full bg-brand-gradient px-6 py-3 text-sm font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
            >
              {isUltra
                ? "Ultra Plus üyesin"
                : tier === "plus"
                  ? "Aktif paketin"
                  : loadingPlan === "plus_monthly"
                    ? "Yönlendiriliyor..."
                    : "Plus’a Geç"}
            </button>
          </div>

          {/* ULTRA PLUS — premium görünüm (overflow-hidden YOK ki rozet kırpılmasın) */}
          <div className="relative mt-3 flex flex-col rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-brand-700/40 to-ink-900 p-6 shadow-glow">
            {/* Glow yalnızca iç katmanda kırpılır; rozet dışarıda kalır */}
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
              <span className="absolute -right-10 -top-10 block h-32 w-32 rounded-full bg-amber-300/25 blur-3xl" />
            </span>
            <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 animate-float whitespace-nowrap rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-900 shadow-glow">
              ⚡ {ultra.highlight ?? "En Güçlü"}
            </span>
            <div className="relative flex items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-wider text-amber-200">Ultra Plus</p>
              <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-bold text-amber-100">
                ULTRA
              </span>
            </div>
            <p className="relative mt-2 text-3xl font-extrabold text-white">
              ₺{ultra.price.toFixed(2)}
              <span className="text-sm font-medium text-amber-100/70"> /ay</span>
            </p>
            <ul className="relative mt-4 flex-1 space-y-2">
              {ULTRA_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2 text-sm text-slate-100">
                  <SparkIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                  {perk}
                </li>
              ))}
            </ul>
            <button
              onClick={() => buy("ultra_plus_monthly")}
              disabled={loadingPlan !== null || isUltra}
              className="relative mt-5 w-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-3 text-sm font-bold text-ink-900 shadow-glow transition-transform active:scale-95 disabled:opacity-60"
            >
              {isUltra
                ? "Aktif paketin"
                : loadingPlan === "ultra_plus_monthly"
                  ? "Yönlendiriliyor..."
                  : "Ultra Plus’a Geç"}
            </button>
          </div>
        </div>

        {/* Karşılaştırma tablosu */}
        <h2 className="mb-3 mt-8 text-lg font-bold text-white">Paket karşılaştırması</h2>
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3 text-left font-semibold">Özellik</th>
                <th className="px-2 py-3 text-center font-semibold">Free</th>
                <th className="px-2 py-3 text-center font-semibold text-brand-200">Plus</th>
                <th className="px-2 py-3 text-center font-semibold text-amber-200">Ultra</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.feature} className={i % 2 ? "bg-white/[0.02]" : ""}>
                  <td className="px-4 py-2.5 text-slate-200">{row.feature}</td>
                  <td className="px-2 py-2.5 text-center text-slate-500">{row.free ? "✓" : "—"}</td>
                  <td className="px-2 py-2.5 text-center text-brand-300">{row.plus ? "✓" : "—"}</td>
                  <td className="px-2 py-2.5 text-center text-amber-300">{row.ultra ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Ödemeler iyzico güvencesiyle alınır. Kart bilgilerin Anonix sunucularında saklanmaz.
        </p>
      </div>
    </Container>
  );
}
