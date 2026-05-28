"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { Modal } from "@/components/ui/Modal";

// Bu rotalarda widget gizlenir (form / yorum / mesajlaşma akışlarında yer kapatmasın).
const HIDDEN_PREFIXES = [
  "/admin",
  "/onboarding",
  "/feedback",
  "/login",
  "/register",
  "/messages",
  "/confessions/new",
  "/golge/new",
];
// Bu eşleşmelerde de gizle: /confessions/[id] ve /golge/[id] gibi detay sayfaları
const HIDDEN_REGEX = [/^\/confessions\/[^/]+$/, /^\/golge\/[^/]+$/];

/**
 * Her sayfada görünen küçük "Geri bildirim" yüzen butonu.
 * Tıklanınca tema-uyumlu Modal içinde FeedbackForm açar.
 * - Yorum/mesaj input'larıyla çakışmaması için ilgili sayfalarda gizlenir.
 * - z-30 (bottom-nav z-40'ın altında — alt navigasyonu örtmez).
 */
export function FeedbackWidget() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);

  const hidden =
    HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    HIDDEN_REGEX.some((re) => re.test(pathname));
  if (hidden) return null;

  return (
    <>
      {/* Yüzen buton — sol altta, bottom-nav üstünde ama içerikten yüksek (mobil safe-area) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Geri bildirim gönder"
        className="anonix-fab fixed left-3 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-ink-800/90 text-lg text-white shadow-card backdrop-blur-md transition-transform hover:scale-105 md:bottom-6"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        💬
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Geri bildirim">
        <FeedbackForm onSent={() => setTimeout(() => setOpen(false), 1500)} />
      </Modal>
    </>
  );
}
