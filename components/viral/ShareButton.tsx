"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { contentShareUrl, ogImageUrl, viralHeadline } from "@/lib/viral";
import { shareTargets } from "@/lib/referrals";
import { useToast } from "@/components/ui/ToastProvider";

interface ShareButtonProps {
  type: "confession" | "golge";
  id: string;
  text: string;
  mood?: string | null;
}

export function ShareButton({ type, id, text, mood }: ShareButtonProps) {
  const { success } = useToast();
  const [open, setOpen] = useState(false);

  const url = contentShareUrl(type, id);
  const headline = viralHeadline(type);
  const ogUrl = ogImageUrl({ type, text, mood: mood || undefined });
  const targets = shareTargets(`${headline}\n${url}`, url);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      success("Bağlantı kopyalandı 📋");
    } catch {
      success(url);
    }
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-brand-300"
        aria-label="Paylaş"
      >
        ↗ Paylaş
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="card w-full max-w-md p-5"
            >
              <h3 className="mb-1 text-lg font-bold text-white">Paylaş</h3>
              <p className="mb-3 text-xs text-slate-400">{headline}</p>

              {/* Viral kart önizleme (OG görseli) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ogUrl}
                alt="Paylaşım kartı"
                className="mb-4 w-full rounded-xl border border-white/10"
              />

              <div className="grid grid-cols-3 gap-2">
                <a href={targets.whatsapp} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2 text-xs">
                  WhatsApp
                </a>
                <a href={targets.twitter} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2 text-xs">
                  X
                </a>
                <a href={targets.telegram} target="_blank" rel="noopener noreferrer" className="btn-ghost !py-2 text-xs">
                  Telegram
                </a>
              </div>

              <button onClick={copyLink} className="btn-primary mt-3 w-full !py-2.5 text-sm">
                Bağlantıyı kopyala
              </button>
              <button
                onClick={() => setOpen(false)}
                className="mt-2 w-full rounded-full py-2 text-xs text-slate-400 hover:text-white"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
