"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Ortak Modal — theme-aware, mobile-safe, keyboard-safe.
 * - Light mode: bg-white text-slate-900 border-slate-200, backdrop yumuşak
 * - Dark mode: bg-ink-900 text-white border-white/10
 * - z-[9999] (her zaman üstte)
 * - max-h-[90dvh] + overflow-y-auto
 * - safe-area-inset-bottom destekli
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
  // Escape ile kapat + scroll kilidi
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthClass =
    size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-md";

  return (
    <div
      className="anonix-modal fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`anonix-modal-card flex w-full ${widthClass} flex-col rounded-2xl border border-white/10 bg-ink-900 text-white shadow-card`}
        style={{
          maxHeight: "min(90dvh, 90vh)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || true) && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/5 px-5 py-3">
            <h3 className="text-base font-bold">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="rounded-full px-2 py-1 text-sm text-slate-400 transition-colors hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-white/5 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
