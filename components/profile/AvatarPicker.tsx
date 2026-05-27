"use client";

import { useState } from "react";
import { AVATAR_URLS } from "@/lib/avatars";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Hazır avatar galerisinden seçim (açılır-kapanır panel).
 * Seçilen avatar profiles.avatar_url'e kaydedilir. (Dosya yükleme yok.)
 */
export function AvatarPicker() {
  const { profile, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const current = profile?.avatar_url ?? null;

  async function pick(url: string) {
    if (saving || url === current) {
      if (url === current) setOpen(false);
      return;
    }
    setSaving(url);
    const res = await updateProfile({ avatar_url: url });
    setSaving(null);
    if (res.error) {
      toastError("Avatar kaydedilemedi. Lütfen tekrar dene.");
    } else {
      success("Avatar güncellendi ✨");
      setOpen(false); // seçince otomatik kapan
    }
  }

  return (
    <div className="card p-5">
      {/* Başlık satırı: seçili avatar önizleme + aç/kapa */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-3">
          <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-800">
            {current ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current} alt="Seçili avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-lg">🙂</span>
            )}
          </span>
          <span className="text-left">
            <span className="block text-sm font-bold text-white">Avatar Seç</span>
            <span className="block text-xs text-slate-400">
              {current ? "Avatarını değiştir" : "Bir avatar seç"}
            </span>
          </span>
        </span>
        <span
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {/* Açılır panel */}
      {open && (
        <div className="animate-fade-up mt-4">
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {AVATAR_URLS.map((url) => {
              const selected = current === url;
              return (
                <button
                  key={url}
                  type="button"
                  onClick={() => pick(url)}
                  disabled={!!saving}
                  aria-pressed={selected}
                  className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-ink-800 transition-all active:scale-95 disabled:opacity-60 ${
                    selected
                      ? "border-brand-500 shadow-glow ring-2 ring-brand-500/40"
                      : "border-white/10 hover:border-brand-400/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Avatar" className="h-full w-full object-cover" loading="lazy" />
                  {selected && (
                    <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                      ✓
                    </span>
                  )}
                  {saving === url && (
                    <span className="absolute inset-0 grid place-items-center bg-black/40 text-xs text-white">
                      …
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Avatarın profilinde ve açık paylaşımlarında görünür.
            </p>
            {current && (
              <button
                type="button"
                onClick={() => pick("")}
                disabled={!!saving}
                className="shrink-0 text-xs font-medium text-slate-400 transition-colors hover:text-white disabled:opacity-50"
              >
                Kaldır
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
