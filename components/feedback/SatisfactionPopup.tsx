"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { isFeatureEnabled } from "@/lib/features";
import { submitFeedback } from "@/lib/feedback";

const SEEN_KEY = "anonix-satisfaction-seen";
const VISIT_KEY = "anonix-visit-count";
// Kullanıcı bu kadar ziyaretten sonra anketi görür (rahatsız etmemek için).
const SHOW_AFTER_VISITS = 3;

/**
 * Memnuniyet anketi pop-up'ı.
 * - satisfaction_popup feature flag açıksa,
 * - giriş yapmış kullanıcıya,
 * - birkaç ziyaretten sonra bir kez gösterilir (localStorage ile).
 */
export function SatisfactionPopup() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY) === "1") return;

    // Ziyaret sayacını artır
    const visits = Number(localStorage.getItem(VISIT_KEY) || "0") + 1;
    localStorage.setItem(VISIT_KEY, String(visits));
    if (visits < SHOW_AFTER_VISITS) return;

    // Feature flag kontrolü, sonra göster
    isFeatureEnabled("satisfaction_popup")
      .then((on) => {
        if (on) setTimeout(() => setVisible(true), 4000);
      })
      .catch(() => {});
  }, [user, loading]);

  function close() {
    localStorage.setItem(SEEN_KEY, "1");
    setVisible(false);
  }

  async function submit() {
    if (rating < 1) return;
    await submitFeedback({
      kind: "satisfaction",
      rating,
      message: comment,
      userId: user?.id ?? null,
    });
    setDone(true);
    localStorage.setItem(SEEN_KEY, "1");
    setTimeout(() => setVisible(false), 1800);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-24 z-[55] mx-auto max-w-sm md:bottom-6">
      <div className="card border-brand-500/30 p-4 shadow-glow">
        {done ? (
          <p className="py-2 text-center text-sm font-semibold text-white">
            Teşekkürler! 💜 Görüşün bizim için değerli.
          </p>
        ) : (
          <>
            <div className="mb-2 flex items-start justify-between">
              <p className="text-sm font-bold text-white">Anonix&apos;i beğeniyor musun?</p>
              <button
                onClick={close}
                aria-label="Kapat"
                className="-mt-1 rounded-full px-1.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="mb-3 text-xs text-slate-400">Deneyimini puanla, birkaç saniye sürer.</p>

            <div className="mb-3 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  aria-label={`${s} yıldız`}
                  className="text-2xl transition-transform hover:scale-110"
                >
                  <span className={(hover || rating) >= s ? "opacity-100" : "opacity-30"}>⭐</span>
                </button>
              ))}
            </div>

            {rating > 0 && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="İstersen birkaç kelime ekle (opsiyonel)"
                className="mb-3 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={close}
                className="flex-1 rounded-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Daha sonra
              </button>
              <button
                onClick={submit}
                disabled={rating < 1}
                className="flex-1 rounded-full bg-brand-gradient px-3 py-2 text-xs font-semibold text-white shadow-glow disabled:opacity-50"
              >
                Gönder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
