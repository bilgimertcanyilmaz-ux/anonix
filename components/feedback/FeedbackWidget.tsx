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
      {/* Yüzen buton — sol altta, premium neon glow */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Geri bildirim gönder"
        className="anonix-fab group fixed left-3 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-brand-400/30 bg-ink-900/85 text-lg text-white shadow-glow-sm backdrop-blur-xl transition-all hover:scale-110 hover:border-brand-300/60 hover:shadow-glow md:bottom-6"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full bg-brand-500/15 opacity-0 blur-md transition-opacity group-hover:opacity-100" />
        <span className="relative">💬</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Geri bildirim">
        <FeedbackForm onSent={() => setTimeout(() => setOpen(false), 1500)} />
      </Modal>
    </>
  );
}
