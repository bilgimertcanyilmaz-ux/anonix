"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { referralLink, referralShareText, shareTargets, REFERRAL_REWARDS } from "@/lib/referrals";

export default function InvitePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const { success } = useToast();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const [copied, setCopied] = useState(false);
  const code = profile?.referral_code || "";
  const link = code ? referralLink(code) : "";
  const targets = code ? shareTargets(referralShareText(code), link) : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      success("Davet linkin kopyalandı 📋");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      success(link);
    }
  }

  const instagramText = referralShareText(code);

  if (loading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-4">
        <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-br from-brand-600 via-brand-800 to-ink-900 p-8 text-center shadow-glow">
          <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-400/20 blur-3xl" />
          <div className="relative">
            <span className="mb-3 inline-block text-4xl">🎁</span>
            <h1 className="text-3xl font-extrabold text-white">Arkadaşını davet et</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/80">
              Davet ettiğin her arkadaş ilk itirafını paylaştığında sen{" "}
              <strong>+{REFERRAL_REWARDS.referrer} puan</strong>, o{" "}
              <strong>+{REFERRAL_REWARDS.referred} puan</strong> kazanır.
            </p>
          </div>
        </div>

        {/* Davet linki */}
        <div className="card mt-6 p-5">
          <label className="mb-2 block text-sm font-medium text-slate-300">Davet linkin</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none"
            />
            <button onClick={copy} className="btn-primary shrink-0 !px-4 !py-2.5 text-xs">
              {copied ? "Kopyalandı" : "Kopyala"}
            </button>
          </div>
          {code && <p className="mt-2 text-xs text-slate-500">Kodun: <span className="font-mono text-brand-300">{code}</span></p>}
        </div>

        {/* Paylaşım kanalları */}
        {targets && (
          <div className="card mt-4 p-5">
            <p className="mb-3 text-sm font-semibold text-white">Paylaş</p>
            <div className="grid grid-cols-3 gap-2">
              <a href={targets.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2.5 text-xs">WhatsApp</a>
              <a href={targets.twitter} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2.5 text-xs">X / Twitter</a>
              <a href={targets.telegram} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2.5 text-xs">Telegram</a>
            </div>
            <div className="mt-4">
              <p className="mb-1 text-xs font-medium text-slate-300">Instagram story için metin</p>
              <button
                onClick={() => { navigator.clipboard.writeText(instagramText); success("Story metni kopyalandı"); }}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left text-xs text-slate-300 hover:bg-white/[0.06]"
              >
                {instagramText}
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-center text-xs text-slate-600">
          Davet, arkadaşın ilk itirafını paylaştıktan sonra aktifleşir (spam koruması).
        </p>
      </div>
    </Container>
  );
}
