"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 24, delay: i * 0.08 },
  }),
};

export default function PlusPage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<SubscriptionType | null>(null);

  const tier = getEffectiveTier(profile);
  const isUltra = tier === "ultra_plus";
  const isPlus = tier === "plus";

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
    if (!user) { router.push("/login"); return; }
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

        {/* ── HERO ───────────────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="relative overflow-hidden rounded-3xl p-8 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(124,58,237,0.55) 40%, rgba(6,6,11,0.85) 100%)",
            border: "1px solid rgba(168,85,247,0.3)",
            boxShadow: "0 0 60px -10px rgba(124,58,237,0.5), 0 20px 60px -20px rgba(0,0,0,0.8)",
          }}
        >
          {/* Glow blobs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gold-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-brand-400/25 blur-3xl" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-32 w-48 -translate-x-1/2 rounded-full bg-accent-400/15 blur-3xl" />

          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-glow"
              style={{
                background: "linear-gradient(135deg, #fcd34d, #f59e0b, #a855f7)",
              }}
            >
              <CrownIcon className="h-8 w-8 text-white" />
            </motion.div>

            <h1 className="text-3xl font-extrabold text-white">Anonix Premium</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/70">
              Sana uygun paketi seç, deneyimini bir üst seviyeye taşı.
            </p>

            {tier !== "free" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-gold-400/50 bg-gold-400/15 px-5 py-2.5 text-sm font-bold text-gold-200"
              >
                <CrownIcon className="h-4 w-4" />
                {TIER_LABELS[tier]} üyesin
                {profile?.plus_expires_at && (
                  <span className="font-normal text-gold-100/70">
                    · {new Date(profile.plus_expires_at).toLocaleDateString("tr-TR")} tarihine kadar
                  </span>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ── PRICING CARDS ──────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* PLUS */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            whileHover={{ y: -4 }}
            className="glass-card flex flex-col p-6 transition-all duration-300"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/20">
                <SparkIcon className="h-5 w-5 text-brand-300" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-brand-300">Plus</p>
                <p className="text-[10px] text-slate-500">Temel premium</p>
              </div>
            </div>

            <div className="mb-5">
              <span className="text-4xl font-extrabold text-white">₺{plus.price.toFixed(2)}</span>
              <span className="text-sm font-medium text-slate-400"> /ay</span>
            </div>

            <ul className="flex-1 space-y-3 mb-6">
              {PLUS_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500/20">
                    <SparkIcon className="h-2.5 w-2.5 text-brand-300" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            <button
              onClick={() => buy("plus_monthly")}
              disabled={loadingPlan !== null || isPlus || isUltra}
              className="btn-premium w-full disabled:opacity-60"
            >
              {isUltra ? "Ultra Plus üyesin" : isPlus ? "✓ Aktif paketin" : loadingPlan === "plus_monthly" ? "Yönlendiriliyor..." : "Plus'a Geç"}
            </button>
          </motion.div>

          {/* ULTRA PLUS */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            whileHover={{ y: -4 }}
            className="relative flex flex-col p-6 transition-all duration-300"
            style={{
              borderRadius: "1.5rem",
              background: "linear-gradient(135deg, rgba(252,211,77,0.12) 0%, rgba(168,85,247,0.22) 50%, rgba(6,6,11,0.7) 100%)",
              border: "2px solid rgba(252,211,77,0.45)",
              boxShadow: "0 0 40px -8px rgba(252,211,77,0.3), 0 0 80px -16px rgba(124,58,237,0.4)",
            }}
          >
            {/* Overflow-hidden only on the glow blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
              <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gold-300/20 blur-3xl" />
              <div className="absolute -bottom-4 left-4 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" />
            </div>

            {/* Featured badge */}
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-900 shadow-glow"
              style={{ background: "linear-gradient(90deg, #fcd34d, #f59e0b)" }}
            >
              ⚡ {ultra.highlight ?? "En Güçlü"}
            </motion.span>

            <div className="relative mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-400/20">
                <CrownIcon className="h-5 w-5 text-gold-300" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-gold-200">Ultra Plus</p>
                <p className="text-[10px] text-gold-100/50">Tam premium deneyim</p>
              </div>
            </div>

            <div className="relative mb-5">
              <span className="text-4xl font-extrabold text-white">₺{ultra.price.toFixed(2)}</span>
              <span className="text-sm font-medium text-gold-100/60"> /ay</span>
            </div>

            <ul className="relative flex-1 space-y-3 mb-6">
              {ULTRA_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-100">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-400/20">
                    <SparkIcon className="h-2.5 w-2.5 text-gold-300" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            <button
              onClick={() => buy("ultra_plus_monthly")}
              disabled={loadingPlan !== null || isUltra}
              className="relative w-full rounded-full px-6 py-3.5 text-sm font-extrabold text-ink-900 shadow-glow transition-all duration-200 active:scale-95 disabled:opacity-60 hover:shadow-glow-gold"
              style={{ background: "linear-gradient(135deg, #fde68a, #f59e0b, #d97706)" }}
            >
              {isUltra ? "✓ Aktif paketin" : loadingPlan === "ultra_plus_monthly" ? "Yönlendiriliyor..." : "Ultra Plus'a Geç"}
            </button>
          </motion.div>
        </div>

        {/* ── COMPARISON TABLE ───────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-white">Paket karşılaştırması</h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Özellik</th>
                  <th className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Free</th>
                  <th className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-brand-300">Plus</th>
                  <th className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gold-300">Ultra</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.04 }}
                    className={`border-b border-white/5 last:border-0 ${i % 2 ? "bg-white/[0.015]" : ""}`}
                  >
                    <td className="px-5 py-3 text-slate-200">{row.feature}</td>
                    <td className="px-3 py-3 text-center text-slate-500">{row.free ? "✓" : "—"}</td>
                    <td className="px-3 py-3 text-center font-semibold text-brand-300">{row.plus ? "✓" : "—"}</td>
                    <td className="px-3 py-3 text-center font-semibold text-gold-300">{row.ultra ? "✓" : "—"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Ödemeler iyzico güvencesiyle alınır. Kart bilgilerin Anonix sunucularında saklanmaz.
        </p>

      </div>
    </Container>
  );
}
