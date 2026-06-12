"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Premium Modal — UI redesign Faz 1.
 * - Glass card sistemi
 * - Framer Motion spring (scale + fade)
 * - Theme-aware, mobile-safe, keyboard-safe
 * - Light: bg-white text-slate-900
 * - Dark: glass-card neon ring
 * - z-[9999], max-h-[90dvh], safe-area-inset-bottom
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  // Escape + scroll kilidi.
  // iOS Safari'de body{overflow:hidden} dokunmatik kaydırmayı ENGELLEMEZ;
  // güvenilir kilit: body'yi position:fixed ile mevcut scroll konumunda
  // dondurmak ve kapanışta konumu geri yüklemek.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  const widthClass =
    size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-md";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="anonix-modal fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-3 backdrop-blur-md sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`anonix-modal-card glass-card flex w-full ${widthClass} flex-col text-white`}
            style={{
              maxHeight: "min(90dvh, 90vh)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5">
                <h3 className="text-base font-bold tracking-tight">{title}</h3>
                <button
                  onClick={onClose}
                  aria-label="Kapat"
                  className="-mr-1 rounded-full p-1.5 text-sm text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

            {footer && (
              <div className="shrink-0 border-t border-white/8 px-5 py-3.5">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
