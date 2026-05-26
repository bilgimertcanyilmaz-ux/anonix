"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";
import { genderOptions } from "@/lib/profile";
import type { Gender } from "@/types";

/**
 * Eksik profil onboarding'i: giriş yapılmış ama `profiles` kaydı yoksa gösterilir.
 * Kullanıcı adı + cinsiyet (zorunlu) + anonim başla seçeneği alınır.
 * Cinsiyet, badge ve profil çerçevesi için zorunludur.
 */
export function ProfileSetup() {
  const { user, refreshProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function validate(): string | null {
    if (username.trim().length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.";
    if (!gender) return "Lütfen bir cinsiyet seç. (Profil çerçevesi ve rozeti için gerekli)";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return;

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);
    const { error: insErr } = await supabase.from("profiles").insert({
      id: user.id,
      username: username.trim(),
      gender,
      is_anonymous: isAnonymous,
    });
    setSaving(false);

    if (insErr) {
      setError(
        insErr.message?.toLowerCase().includes("duplicate") || insErr.code === "23505"
          ? "Bu kullanıcı adı zaten alınmış. Başka bir tane dene."
          : "Profil oluşturulamadı. Lütfen tekrar dene."
      );
      return;
    }
    await refreshProfile();
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card p-6">
        <h1 className="text-xl font-extrabold text-white">Profilini tamamla</h1>
        <p className="mt-1 text-sm text-slate-400">
          Anonix&apos;e başlamak için birkaç bilgiye ihtiyacımız var.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <Alert tone="error">{error}</Alert>}

          <Input
            id="setup-username"
            label="Kullanıcı adı"
            placeholder="gizli_rumuz"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Cinsiyet (zorunlu) */}
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-slate-300">Cinsiyet</span>
            <div className="grid grid-cols-3 gap-2">
              {genderOptions.map((opt) => {
                const active = gender === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGender(opt.value)}
                    className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Anonim başla */}
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-medium text-white">Anonim başla</span>
              <span className="block text-xs text-slate-400">
                Profilin gizli kalsın, kimliğin görünmesin.
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                isAnonymous ? "bg-brand-500" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  isAnonymous ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Kaydediliyor..." : "Profili oluştur"}
          </Button>
        </form>
      </div>
    </div>
  );
}
