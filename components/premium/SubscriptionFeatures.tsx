"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSubscriptionTier } from "@/lib/subscription";
import { getBoostStatus } from "@/lib/boost";
import type { BoostStatus } from "@/types";

interface FeatureCard {
  icon: string;
  title: string;
  href?: string;
  soon?: boolean;
  note?: string;
}

/**
 * Profil sayfasında paket bazlı "Abonelik Özellikleri" alanı — premium UI Faz 1.
 * Free → premium CTA çift kartı (Plus + Ultra Plus gold aura).
 * Plus → mor glass + Plus özellikleri.
 * Ultra Plus → gold aura + tüm premium kısayollar.
 */
export function SubscriptionFeatures() {
  const { profile } = useAuth();
  const tier = getSubscriptionTier(profile);
  const [boost, setBoost] = useState<BoostStatus | null>(null);

  useEffect(() => {
    if (profile && tier !== "free") getBoostStatus(profile).then(setBoost);
  }, [profile, tier]);

  if (!profile) return null;

  // --- Free: çift premium CTA kartı ---
  if (tier === "free") {
    return (
      <div className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">Abonelik Özellikleri</h2>
            <p className="mt-0.5 text-xs text-slate-400">
              Premium özellikleri açmak için bir paket seç.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Plus CTA */}
          <Link href="/plus" className="group block">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="relative overflow-hidden rounded-2xl border border-brand-500/40 bg-gradient-to-br from-brand-500/15 via-brand-700/10 to-transparent p-4 shadow-glow-sm transition-shadow group-hover:shadow-glow"
            >
              <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-brand-500/20 blur-2xl" />
              <span className="relative flex items-center gap-1.5 text-sm font-bold tracking-wide tier-cta-plus">
                <span className="text-base">👑</span> Plus&apos;a Geç
              </span>
              <span className="relative mt-1 block text-xs text-slate-400">
                Mesajlaşma, kim beğendi, boost…
              </span>
            </motion.div>
          </Link>

          {/* Ultra Plus CTA — gold aura */}
          <Link href="/plus" className="group block">
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className="glass-card-gold relative overflow-hidden p-4 animate-pulse-glow-gold transition-transform group-hover:scale-[1.015]"
            >
              <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold-400/30 blur-2xl" />
              <span className="relative flex items-center gap-1.5 text-sm font-extrabold tracking-wide tier-cta-ultra">
                <span className="text-base">⚡</span> Ultra Plus&apos;a Geç
              </span>
              <span className="relative mt-1 block text-xs text-slate-400">
                Hayalet mod, kimler baktı, temalar…
              </span>
            </motion.div>
          </Link>
        </div>
      </div>
    );
  }

  const boostNote = boost ? `${boost.remaining}/${boost.quota} hak kaldı` : "…";

  const plusCards: FeatureCard[] = [
    { icon: "❤️", title: "Kim Beğendi", note: "İtiraf/Gölge detayında beğeni sayısına dokun" },
    { icon: "🚀", title: "Boost Haklarım", note: boostNote },
    { icon: "📊", title: "Temel İstatistikler", href: "/profile/analytics" },
    { icon: "💬", title: "Mesajlaşma", href: "/messages" },
  ];

  const ultraCards: FeatureCard[] = [
    { icon: "👁️", title: "Profilime Kimler Baktı", href: "/profile/views" },
    { icon: "🥷", title: "Hayalet Mod", href: "/settings/privacy" },
    { icon: "📈", title: "Gelişmiş İstatistikler", href: "/profile/analytics" },
    { icon: "🎨", title: "Premium Temalar", href: "/settings/themes" },
    { icon: "⏳", title: "Kaybolan Mesajlar", href: "/messages" },
    { icon: "🚪", title: "Plus Lounge / Özel Odalar", href: "/plus/lounge" },
    { icon: "🌙", title: "Gece Alanı", href: "/plus/night" },
  ];

  const cards = tier === "ultra_plus" ? [...plusCards, ...ultraCards] : plusCards;
  const isUltra = tier === "ultra_plus";

  return (
    <div
      className={
        isUltra
          ? "glass-card-gold relative overflow-hidden p-5"
          : "glass-card p-5"
      }
    >
      {/* Ultra Plus için arka plan glow */}
      {isUltra && (
        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gold-400/15 blur-3xl"
        />
      )}
      <div className="relative mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Abonelik Özellikleri</h2>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold backdrop-blur ${
            isUltra
              ? "bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950 shadow-glow-gold"
              : "border border-brand-400/40 bg-brand-500/20 text-brand-200 shadow-glow-sm"
          }`}
        >
          {isUltra ? "ULTRA PLUS" : "PLUS"}
        </span>
      </div>
      <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cards.map((c) => {
          const inner = (
            <>
              <span className="flex items-center gap-2">
                <span className="text-lg">{c.icon}</span>
                <span className="text-sm font-semibold text-white">{c.title}</span>
              </span>
              {c.soon ? (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                  Yakında
                </span>
              ) : c.href ? (
                <span className="text-brand-300 transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              ) : null}
            </>
          );
          const base =
            "flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur";
          return c.href && !c.soon ? (
            <Link
              key={c.title}
              href={c.href}
              className={`group ${base} transition-all hover:border-brand-400/50 hover:bg-white/[0.07] hover:shadow-glow-sm`}
            >
              {inner}
            </Link>
          ) : (
            <div key={c.title} className={base}>
              <span>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-sm font-semibold text-white">{c.title}</span>
                </span>
                {c.note && (
                  <span className="mt-0.5 block pl-7 text-[11px] text-slate-400">
                    {c.note}
                  </span>
                )}
              </span>
              {c.soon && (
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                  Yakında
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
