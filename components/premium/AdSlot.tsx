"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { isPlusOrAbove } from "@/lib/subscription";

/**
 * Reklam alanı (placeholder).
 * - Plus / Ultra Plus (ve admin): reklamsız → hiçbir şey göstermez.
 * - Free: reklam yer tutucu + yükseltme çağrısı.
 * Gerçek reklam ağı entegrasyonu ileride buraya bağlanır.
 */
export function AdSlot({ className = "" }: { className?: string }) {
  const { profile } = useAuth();
  if (isPlusOrAbove(profile) || profile?.role === "admin") return null;

  return (
    <Link
      href="/plus"
      className={`flex items-center justify-between gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-3 ${className}`}
    >
      <span className="text-xs text-slate-400">
        <span className="mr-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase">Reklam</span>
        Reklamsız deneyim için Plus’a geç
      </span>
      <span className="shrink-0 text-xs font-semibold text-brand-300">Kaldır →</span>
    </Link>
  );
}
