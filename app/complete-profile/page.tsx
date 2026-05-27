"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { genderOptions } from "@/lib/profile";
import type { Gender } from "@/types";

/**
 * OAuth (Google/Apple) ile gelen kullanıcıların profilini tamamladığı ekran.
 * username + gender + 17+ onayı zorunlu; "anonim başla" varsayılan açık.
 */
export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile } = useAuth();

  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<Gender>("other");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Giriş yoksa login'e; profil zaten tamamsa ana sayfaya.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (
      profile &&
      profile.age_confirmed &&
      profile.username &&
      !/^kullanici_/.test(profile.username)
    ) {
      router.replace("/");
    }
  }, [loading, user, profile, router]);

  // Mevcut profilden (otomatik üretilmemişse) ön doldur.
  useEffect(() => {
    if (profile) {
      if (profile.username && !/^kullanici_/.test(profile.username)) {
        setUsername(profile.username);
      }
      if (profile.gender) setGender(profile.gender);
      setIsAnonymous(profile.is_anonymous);
    }
  }, [profile]);

  function validate(): string | null {
    if (username.trim().length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.";
    if (!ageConfirmed) return "Devam etmek için 17 yaşından büyük olduğunu onaylamalısın.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSaving(true);
    const res = await updateProfile({
      username: username.trim(),
      gender,
      is_anonymous: isAnonymous,
      age_confirmed: true,
      age_confirmed_at: new Date().toISOString(),
    });
    setSaving(false);
    if (res.error) {
      setError(
        res.error.includes("duplicate") || res.error.toLowerCase().includes("unique")
          ? "Bu kullanıcı adı zaten alınmış. Başka bir tane dene."
          : res.error
      );
      return;
    }
    router.replace("/");
  }

  if (loading || !user) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
    );
  }

  return (
    <AuthShell
      title="Profilini tamamla"
      subtitle="Anonix'e hoş geldin! Devam etmek için birkaç bilgi gerekiyor."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <Input
          id="username"
          label="Kullanıcı adı"
          placeholder="gizli_rumuz"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* Cinsiyet */}
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

        {/* Yaş onayı */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
          />
          <span className="text-xs leading-relaxed text-slate-400">
            17 yaşından büyük olduğumu, Kullanım Şartları ve Topluluk Kuralları&apos;nı kabul
            ettiğimi onaylıyorum.
          </span>
        </label>

        <Button type="submit" disabled={saving || !ageConfirmed} className="w-full">
          {saving ? "Kaydediliyor..." : "Devam et"}
        </Button>
      </form>
    </AuthShell>
  );
}
