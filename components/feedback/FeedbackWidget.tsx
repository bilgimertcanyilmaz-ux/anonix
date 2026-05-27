"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

// Bu rotalarda widget gizlenir (form ekranları / admin / onboarding sade kalsın).
const HIDDEN_PREFIXES = ["/admin", "/onboarding", "/feedback", "/login", "/register"];

/**
 * Her sayfada görünen küçük "Geri bildirim" yüzen butonu.
 * Tıklanınca alttan açılan bir kart içinde FeedbackForm gösterir.
 */
export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
      HIDDEN_PREFIXES.includes(pathname)) {
    return null;
  }

  return (
    <>
      {/* Yüzen buton — sol altta, bottom-nav üstünde */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Geri bildirim gönder"
        className="fixed bottom-24 left-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-ink-800/90 text-lg shadow-card backdrop-blur-md transition-transform hover:scale-105 md:bottom-6"
      >
        💬
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="card w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Geri bildirim</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="rounded-full px-2 py-1 text-sm text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <FeedbackForm onSent={() => setTimeout(() => setOpen(false), 1500)} />
          </div>
        </div>
      )}
    </>
  );
}
