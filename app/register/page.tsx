"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { genderOptions } from "@/lib/profile";
import type { Gender } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [gender, setGender] = useState<Gender>("other");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Davet kodunu URL'den al (?ref=CODE)
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  function validate(): string | null {
    if (username.trim().length < 3)
      return "Kullanıcı adı en az 3 karakter olmalı.";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.";
    if (!email.includes("@")) return "Geçerli bir e-posta adresi gir.";
    if (password.length < 6) return "Şifre en az 6 karakter olmalı.";
    if (password !== confirm) return "Şifreler eşleşmiyor.";
    if (!ageConfirmed) return "Devam etmek için 17 yaşından büyük olduğunu onaylamalısın.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    const result = await signUp({
      username: username.trim(),
      email: email.trim(),
      password,
      gender,
      isAnonymous,
      ageConfirmed,
      referralCode,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setSuccess(
        "Hesabın oluşturuldu! E-posta adresine gönderilen doğrulama bağlantısına tıkla, ardından giriş yap."
      );
      return;
    }

    // Kayıt + profil hazır → ilk girişte onboarding göster.
    router.push("/onboarding");
  }

  return (
    <AuthShell
      title="Hesap oluştur"
      subtitle="Anonix'e katıl, kim olduğunu söylemeden içini dök."
      footer={
        <>
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
            Giriş yap
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}
        {referralCode && !success && (
          <Alert tone="info">
            🎁 Davetle geldin! İlk itirafından sonra +100 puan kazanacaksın.
          </Alert>
        )}

        <Input
          id="username"
          label="Kullanıcı adı"
          placeholder="gizli_rumuz"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          id="email"
          type="email"
          label="E-posta"
          placeholder="ornek@eposta.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          id="password"
          type="password"
          label="Şifre"
          placeholder="En az 6 karakter"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          id="confirm"
          type="password"
          label="Şifre tekrar"
          placeholder="Şifreni tekrar gir"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {/* Cinsiyet seçimi */}
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

        {/* Anonim başla toggle */}
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

        {/* Yaş onayı (mağaza uyumluluğu — 17+) */}
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

        <Button type="submit" disabled={loading || !ageConfirmed} className="w-full">
          {loading ? "Oluşturuluyor..." : "Hesap oluştur"}
        </Button>
      </form>
    </AuthShell>
  );
}
