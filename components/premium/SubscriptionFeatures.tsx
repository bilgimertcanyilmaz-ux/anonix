"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
 * Profil sayfasında paket bazlı "Abonelik Özellikleri" alanı.
 * Free → yükseltme; Plus → Plus özellikleri; Ultra Plus → tüm premium kısayollar.
 */
export function SubscriptionFeatures() {
  const { profile } = useAuth();
  const tier = getSubscriptionTier(profile);
  const [boost, setBoost] = useState<BoostStatus | null>(null);

  useEffect(() => {
    if (profile && tier !== "free") getBoostStatus(profile).then(setBoost);
  }, [profile, tier]);

  if (!profile) return null;

  // --- Free: yükseltme çağrısı ---
  if (tier === "free") {
    return (
      <div className="card p-5">
        <h2 className="mb-1 text-sm font-bold text-white">Abonelik Özellikleri</h2>
        <p className="mb-4 text-xs text-slate-400">
          Premium özellikleri açmak için bir paket seç.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/plus"
            className="flex flex-col gap-1 rounded-2xl border border-brand-500/40 bg-brand-500/10 p-4 transition-colors hover:bg-brand-500/15"
          >
            <span className="text-sm font-bold text-brand-200">Plus’a Geç</span>
            <span className="text-xs text-slate-400">Mesajlaşma, kim beğendi, boost…</span>
          </Link>
          <Link
            href="/plus"
            className="flex flex-col gap-1 rounded-2xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/15 to-brand-700/30 p-4 transition-transform hover:scale-[1.02]"
          >
            <span className="text-sm font-extrabold text-amber-200">Ultra Plus’a Geç ⚡</span>
            <span className="text-xs text-slate-300">Hayalet mod, kimler baktı, temalar…</span>
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

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Abonelik Özellikleri</h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            tier === "ultra_plus"
              ? "bg-gradient-to-r from-amber-300 to-amber-500 text-ink-900"
              : "bg-brand-500/20 text-brand-200"
          }`}
        >
          {tier === "ultra_plus" ? "ULTRA PLUS" : "PLUS"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                <span className="text-brand-300">→</span>
              ) : null}
            </>
          );
          const base =
            "flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3";
          return c.href && !c.soon ? (
            <Link key={c.title} href={c.href} className={`${base} transition-colors hover:bg-white/[0.06]`}>
              {inner}
            </Link>
          ) : (
            <div key={c.title} className={base}>
              <span>
                <span className="flex items-center gap-2">
                  <span className="text-lg">{c.icon}</span>
                  <span className="text-sm font-semibold text-white">{c.title}</span>
                </span>
                {c.note && <span className="mt-0.5 block pl-7 text-[11px] text-slate-400">{c.note}</span>}
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
