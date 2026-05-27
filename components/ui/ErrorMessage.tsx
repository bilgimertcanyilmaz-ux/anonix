import type { ReactNode } from "react";

/**
 * Tema uyumlu hata mesajı kutusu.
 * - Koyu tema: yumuşak kırmızı (red-500/10 + red-200).
 * - Açık tema: rose-50 zemin, red-200 kenar, red-700 metin (globals.css `.alert-error`).
 */
export function ErrorMessage({ children }: { children: ReactNode }) {
  return (
    <div className="alert-error rounded-xl border px-4 py-3 text-sm" role="alert">
      {children}
    </div>
  );
}
