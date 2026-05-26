"use client";

import { useState } from "react";
import { AVATAR_URLS } from "@/lib/avatars";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";

/**
 * Hazır avatar galerisinden seçim. Seçilen avatar profiles.avatar_url'e kaydedilir.
 * (Dosya yükleme yok — yalnızca hazır PNG avatarlar.)
 */
export function AvatarPicker() {
  const { profile, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const current = profile?.avatar_url ?? null;

  async function pick(url: string) {
    if (saving || url === current) return;
    setSaving(url);
    const res = await updateProfile({ avatar_url: url });
    setSaving(null);
    if (res.error) toastError("Avatar kaydedilemedi. Lütfen tekrar dene.");
    else success("Avatar güncellendi ✨");
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Avatar Seç</h2>
        {current && (
          <button
            type="button"
            onClick={() => pick("")}
            disabled={!!saving}
            className="text-xs font-medium text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          >
            Kaldır
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
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
      <p className="mt-3 text-xs text-slate-500">
        Avatarın profilinde ve açık paylaşımlarında görünür. Anonim paylaşımlarda gizlenir.
      </p>
    </div>
  );
}
