"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

/** Avantaj metnine uygun küçük emoji ikonu. */
function perkEmoji(perk: string): string {
  const p = perk.toLocaleLowerCase("tr");
  if (p.includes("her şey")) return "⭐";
  if (p.includes("mesajlaş")) return "💬";
  if (p.includes("reklamsız")) return "🚫";
  if (p.includes("rozet")) return "🏅";
  if (p.includes("çerçeve")) return "🖼️";
  if (p.includes("öne çıkma")) return "📈";
  if (p.includes("boost")) return "🚀";
  if (p.includes("istatistik")) return "📊";
  if (p.includes("beğendi")) return "❤️";
  if (p.includes("görüntüledi")) return "👀";
  if (p.includes("hayalet")) return "👻";
  if (p.includes("oda")) return "🚪";
  if (p.includes("tema")) return "🎨";
  if (p.includes("glow")) return "✨";
  if (p.includes("kaybolan")) return "⏳";
  if (p.includes("gece")) return "🌙";
  if (p.includes("gizlilik")) return "🔒";
  return "✓";
}

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

    // iOS native: Apple StoreKit IAP (App Store policy zorunlu)
    const { getPlatform } = await import("@/lib/native");
    if ((await getPlatform()) === "ios") {
      const { purchaseApplePlan } = await import("@/lib/payments/storekit");
      const planId = type === "plus_monthly" ? "plus_monthly" : "ultra_plus_monthly";
      const result = await purchaseApplePlan(planId);
      setLoadingPlan(null);
      if (result.success) {
        success("Aboneliğin aktif! 👑");
        refreshProfile();
      } else if (result.error) {
        toastError(result.error);
      }
      return;
    }

    // Web / Android: iyzico checkout
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

  /** Apple zorunlu: "Restore Purchases" butonu — eski abonelik aktarımı. */
  async function restoreApple() {
    const { restoreApplePurchases } = await import("@/lib/payments/storekit");
    const r = await restoreApplePurchases();
    if (r.active) {
      success("Aboneliğin geri yüklendi! 👑");
      refreshProfile();
    } else if (r.error) {
      toastError(r.error);
    } else {
      toastError("Aktif abonelik bulunamadı.");
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
          className="anonix-dark-card relative overflow-hidden rounded-3xl p-8 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(124,58,237,0.5) 40%, rgba(8,6,18,0.92) 100%)",
            border: "1px solid rgba(168,85,247,0.3)",
            boxShadow: "0 0 60px -10px rgba(124,58,237,0.5), 0 20px 60px -20px rgba(0,0,0,0.8)",
          }}
        >
          {/* Aurora ışıkları */}
          <motion.div
            aria-hidden
            animate={{ x: [0, 16, 0], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gold-400/20 blur-3xl"
          />
          <motion.div
            aria-hidden
            animate={{ x: [0, -14, 0], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-brand-400/25 blur-3xl"
          />

          {/* Mini yıldızlar */}
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            {[
              { l: "12%", t: "22%", d: 0 },
              { l: "85%", t: "30%", d: 1.2 },
              { l: "24%", t: "72%", d: 0.6 },
              { l: "72%", t: "78%", d: 1.8 },
            ].map((s, i) => (
              <motion.span
                key={i}
                animate={{ opacity: [0.2, 0.9, 0.2] }}
                transition={{ duration: 2.6 + s.d, delay: s.d, repeat: Infinity }}
                className="absolute h-1 w-1 rounded-full bg-white"
                style={{ left: s.l, top: s.t, boxShadow: "0 0 6px rgba(255,255,255,0.9)" }}
              />
            ))}
          </div>

          <div className="relative">
            {/* Taç — dönen ışık halkalı */}
            <div className="relative mx-auto mb-5 h-20 w-20">
              <motion.span
                aria-hidden
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-1.5 rounded-3xl opacity-80"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 0%, rgba(252,211,77,0.9) 20%, transparent 45%, rgba(168,85,247,0.8) 70%, transparent 100%)",
                  padding: "2px",
                  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                className="relative flex h-20 w-20 items-center justify-center rounded-3xl shadow-glow"
                style={{ background: "linear-gradient(135deg, #fcd34d, #f59e0b, #a855f7)" }}
              >
                <CrownIcon className="h-9 w-9 text-white drop-shadow" />
              </motion.div>
            </div>

            <h1 className="text-3xl font-extrabold text-white sm:text-4xl">Anonix Premium</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/70">
              Sana uygun paketi seç, deneyimini bir üst seviyeye taşı.
            </p>

            {tier !== "free" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-gold-400/50 bg-gold-400/15 px-5 py-2.5 text-sm font-bold text-gold-200"
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

            {/* Üye olunca çapraz yönlendirme */}
            {tier !== "free" && (
              <div className="mt-3">
                <Link
                  href="/settings/themes"
                  className="text-xs font-semibold text-brand-200 underline-offset-4 hover:underline"
                >
                  🎨 Premium çerçevelerine göz at →
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── PAKET KARTLARI ─────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* PLUS */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            whileHover={{ y: -4 }}
            className="glass-card relative flex flex-col p-6 transition-all duration-300"
          >
            <span className="absolute right-5 top-5 rounded-full bg-brand-500/15 px-2.5 py-1 text-[10px] font-bold text-brand-300 ring-1 ring-inset ring-brand-400/30">
              Başlangıç için ideal
            </span>

            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20">
                <SparkIcon className="h-5 w-5 text-brand-300" />
              </span>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-widest text-brand-300">Plus</p>
                <p className="text-[10px] text-slate-500">Temel premium</p>
              </div>
            </div>

            <div className="mb-1">
              <span className="text-4xl font-extrabold text-white">₺{plus.price.toFixed(2)}</span>
              <span className="text-sm font-medium text-slate-400"> /ay</span>
            </div>
            <p className="mb-5 text-[11px] text-slate-500">≈ ₺{(plus.price / 30).toFixed(2)}/gün</p>

            <ul className="mb-6 flex-1 space-y-2.5">
              {PLUS_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[11px]">
                    {perkEmoji(perk)}
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
              {isUltra
                ? "Ultra Plus üyesin"
                : isPlus
                  ? "✓ Aktif paketin"
                  : loadingPlan === "plus_monthly"
                    ? "Yönlendiriliyor..."
                    : "Plus'a Geç"}
            </button>
          </motion.div>

          {/* ULTRA PLUS */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            whileHover={{ y: -4 }}
            className="anonix-dark-card relative flex flex-col p-6 transition-all duration-300"
            style={{
              borderRadius: "1.5rem",
              background:
                "linear-gradient(135deg, rgba(252,211,77,0.14) 0%, rgba(168,85,247,0.24) 50%, rgba(8,6,18,0.85) 100%)",
              border: "2px solid rgba(252,211,77,0.45)",
              boxShadow: "0 0 40px -8px rgba(252,211,77,0.3), 0 0 80px -16px rgba(124,58,237,0.4)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden>
              <motion.div
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gold-300/20 blur-3xl"
              />
              <div className="absolute -bottom-4 left-4 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" />
              {/* Köşegen parlama süpürmesi */}
              <motion.div
                animate={{ x: ["-130%", "230%"] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2.5 }}
                className="absolute inset-y-0 w-1/4 -skew-x-12"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(252,211,77,0.12), transparent)",
                }}
              />
            </div>

            {/* En güçlü rozeti */}
            <motion.span
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-ink-900 shadow-glow"
              style={{ background: "linear-gradient(90deg, #fcd34d, #f59e0b)" }}
            >
              ⚡ {ultra.highlight ?? "En Güçlü"}
            </motion.span>

            <div className="relative mb-4 flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/20">
                <CrownIcon className="h-5 w-5 text-gold-300" />
              </span>
              <div>
                <p className="text-sm font-extrabold uppercase tracking-widest text-gold-200">
                  Ultra Plus
                </p>
                <p className="text-[10px] text-gold-100/50">Tam premium deneyim</p>
              </div>
            </div>

            <div className="relative mb-1">
              <span className="text-4xl font-extrabold text-white">₺{ultra.price.toFixed(2)}</span>
              <span className="text-sm font-medium text-gold-100/60"> /ay</span>
            </div>
            <p className="relative mb-5 text-[11px] text-gold-100/50">≈ ₺{(ultra.price / 30).toFixed(2)}/gün</p>

            <ul className="relative mb-6 flex-1 space-y-2.5">
              {ULTRA_PERKS.map((perk, i) => (
                <li
                  key={perk}
                  className={`flex items-start gap-2.5 text-sm text-slate-100 ${
                    i === 0 ? "rounded-lg bg-gold-400/10 px-2 py-1.5 -mx-2 font-semibold text-gold-200" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-[11px]">
                    {perkEmoji(perk)}
                  </span>
                  {perk}
                </li>
              ))}
            </ul>

            <button
              onClick={() => buy("ultra_plus_monthly")}
              disabled={loadingPlan !== null || isUltra}
              className="group relative w-full overflow-hidden rounded-full px-6 py-3.5 text-sm font-extrabold text-ink-900 shadow-glow transition-all duration-200 active:scale-95 disabled:opacity-60 hover:shadow-glow-gold"
              style={{ background: "linear-gradient(135deg, #fde68a, #f59e0b, #d97706)" }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0">
                <motion.span
                  animate={{ x: ["-120%", "220%"] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.4 }}
                  className="absolute inset-y-0 w-1/3"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)" }}
                />
              </span>
              <span className="relative">
                {isUltra
                  ? "✓ Aktif paketin"
                  : loadingPlan === "ultra_plus_monthly"
                    ? "Yönlendiriliyor..."
                    : "Ultra Plus'a Geç"}
              </span>
            </button>
          </motion.div>
        </div>

        {/* ── GÜVEN ŞERİDİ ───────────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-6 grid grid-cols-3 gap-3"
        >
          {[
            { icon: "🔒", title: "iyzico güvencesi", desc: "Kart bilgilerin bizde saklanmaz" },
            { icon: "⚡", title: "Anında aktivasyon", desc: "Ödeme biter bitmez aktif" },
            { icon: "🔁", title: "İstediğin an iptal", desc: "Taahhüt yok, tek tıkla" },
          ].map((t) => (
            <div key={t.title} className="card flex flex-col items-center gap-1 p-3 text-center sm:p-4">
              <span className="text-xl">{t.icon}</span>
              <p className="text-xs font-bold text-slate-200">{t.title}</p>
              <p className="hidden text-[10px] leading-snug text-slate-500 sm:block">{t.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* ── KARŞILAŞTIRMA TABLOSU ──────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-sm">⚖️</span>
            Paket karşılaştırması
          </h2>
          <div className="glass-card overflow-hidden">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col />
                <col className="w-11 sm:w-16" />
                <col className="w-11 sm:w-16" />
                <col className="w-14 sm:w-20" />
              </colgroup>
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:px-5 sm:text-xs">
                    Özellik
                  </th>
                  <th className="px-1 py-3.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:px-3 sm:text-xs">
                    Free
                  </th>
                  <th className="px-1 py-3.5 text-center text-[10px] font-semibold uppercase tracking-wider text-brand-300 sm:px-3 sm:text-xs">
                    Plus
                  </th>
                  <th className="bg-gold-400/[0.07] px-1 py-3.5 text-center text-[10px] font-semibold uppercase tracking-wider text-gold-300 sm:px-3 sm:text-xs">
                    <span className="hidden sm:inline">👑 </span>Ultra
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                    className={`border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03] ${
                      i % 2 ? "bg-white/[0.015]" : ""
                    }`}
                  >
                    <td className="break-words px-3 py-3 text-[13px] leading-snug text-slate-200 sm:px-5 sm:text-sm">
                      {row.feature}
                    </td>
                    <td className="px-1 py-3 text-center text-slate-600 sm:px-3">
                      {row.free ? "✓" : "✕"}
                    </td>
                    <td className="px-1 py-3 text-center font-semibold text-brand-300 sm:px-3">
                      {row.plus ? "✓" : <span className="font-normal text-slate-600">✕</span>}
                    </td>
                    <td className="bg-gold-400/[0.07] px-1 py-3 text-center font-bold text-gold-300 sm:px-3">
                      {row.ultra ? "✓" : "✕"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Ödemeler iyzico güvencesiyle alınır. Kart bilgilerin Anonix sunucularında saklanmaz.
        </p>

      </div>
    </Container>
  );
}
