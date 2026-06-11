"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/auth/AuthProvider";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { genderOptions } from "@/lib/profile";
import { isFeatureEnabled } from "@/lib/features";
import { checkInviteCode } from "@/lib/invites";
import type { Gender } from "@/types";

/** Cinsiyet kartı görselleri. */
const GENDER_META: Record<string, { emoji: string; accent: string }> = {
  male: { emoji: "👨", accent: "#38bdf8" },
  female: { emoji: "👩", accent: "#f472b6" },
  other: { emoji: "🎭", accent: "#a78bfa" },
};

/** Şifre gücü: 0-3 (uzunluk + çeşitlilik). */
function passwordStrength(p: string): number {
  if (p.length < 6) return 0;
  let s = 1;
  if (p.length >= 10) s++;
  if (/[A-ZĞÜŞİÖÇ]/.test(p) && /\d/.test(p)) s++;
  return s;
}
const STRENGTH = [
  { label: "Çok kısa", color: "#475569", w: "8%" },
  { label: "Zayıf", color: "#ef4444", w: "33%" },
  { label: "İyi", color: "#f59e0b", w: "66%" },
  { label: "Güçlü", color: "#10b981", w: "100%" },
];

/** Alan altı canlı durum satırı. */
function FieldHint({ ok, msg, show }: { ok: boolean; msg: string; show: boolean }) {
  if (!show) return null;
  return (
    <p className={`mt-1 text-[11px] ${ok ? "text-emerald-300" : "text-red-300"}`}>
      {ok ? "✓" : "✕"} {msg}
    </p>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [gender, setGender] = useState<Gender>("other");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Soft launch: davet kodu (beta_mode açıkken zorunlu)
  const [betaMode, setBetaMode] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // Davet/referral kodunu URL'den al (?ref=CODE veya ?invite=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
    const inv = params.get("invite");
    if (inv) setInviteCode(inv);
    // beta_mode bayrağını kontrol et
    isFeatureEnabled("beta_mode").then(setBetaMode).catch(() => {});
  }, []);

  // ── Canlı doğrulama durumu ──────────────────────────────────
  const usernameOk = username.trim().length >= 3 && /^[a-zA-Z0-9_]+$/.test(username.trim());
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const strength = passwordStrength(password);
  const passOk = password.length >= 6;
  const confirmOk = confirm.length > 0 && confirm === password;
  const inviteOk = !betaMode || inviteCode.trim().length >= 3;
  const formReady = usernameOk && emailOk && passOk && confirmOk && inviteOk && ageConfirmed;

  function validate(): string | null {
    if (username.trim().length < 3) return "Kullanıcı adı en az 3 karakter olmalı.";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      return "Kullanıcı adı yalnızca harf, rakam ve alt çizgi içerebilir.";
    if (!email.includes("@")) return "Geçerli bir e-posta adresi gir.";
    if (password.length < 6) return "Şifre en az 6 karakter olmalı.";
    if (password !== confirm) return "Şifreler eşleşmiyor.";
    if (betaMode && inviteCode.trim().length < 3)
      return "Şu an yalnızca davetle katılım açık. Geçerli bir davet kodu gir.";
    if (!ageConfirmed) return "Devam etmek için 18 yaşından büyük olduğunu onaylamalısın.";
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

    // Beta modda davet kodunu sunucuda doğrula
    if (betaMode) {
      const valid = await checkInviteCode(inviteCode);
      if (!valid) {
        setLoading(false);
        setError("Davet kodu geçersiz, süresi dolmuş veya kullanım hakkı bitmiş.");
        return;
      }
    }

    const result = await signUp({
      username: username.trim(),
      email: email.trim(),
      password,
      gender,
      isAnonymous,
      ageConfirmed,
      referralCode,
      inviteCode: betaMode ? inviteCode.trim() : null,
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

  const passInputCls =
    "w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-16 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-500/20";

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
      <OAuthButtons />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}
        {referralCode && !success && (
          <Alert tone="info">🎁 Davetle geldin! İlk itirafından sonra +100 puan kazanacaksın.</Alert>
        )}
        {betaMode && !success && (
          <Alert tone="info">
            🔒 Anonix şu an kapalı beta&apos;da. Katılmak için bir davet kodu gerekiyor.
          </Alert>
        )}

        {betaMode && (
          <Input
            id="inviteCode"
            label="Davet kodu"
            placeholder="ör. ANONIX-BETA"
            autoComplete="off"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        )}

        {/* Kullanıcı adı */}
        <div>
          <Input
            id="username"
            label="Kullanıcı adı"
            placeholder="gizli_rumuz"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <FieldHint
            show={username.length > 0}
            ok={usernameOk}
            msg={
              usernameOk
                ? "Kullanılabilir biçimde"
                : username.trim().length < 3
                  ? "En az 3 karakter"
                  : "Yalnızca harf, rakam ve alt çizgi"
            }
          />
        </div>

        {/* E-posta */}
        <div>
          <Input
            id="email"
            type="email"
            label="E-posta"
            placeholder="ornek@eposta.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FieldHint show={email.length > 0} ok={emailOk} msg={emailOk ? "Geçerli adres" : "Geçerli bir e-posta gir"} />
        </div>

        {/* Şifre + güç göstergesi */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
            Şifre
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="En az 6 karakter"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={passInputCls}
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Şifreyi gizle" : "Şifreyi göster"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-xs text-slate-400 transition-colors hover:text-white"
            >
              {showPass ? "🙈 Gizle" : "👁️ Göster"}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-1.5">
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  animate={{ width: STRENGTH[strength].w }}
                  transition={{ type: "spring", stiffness: 260, damping: 26 }}
                  className="h-full rounded-full"
                  style={{ background: STRENGTH[strength].color }}
                />
              </div>
              <p className="mt-1 text-[11px]" style={{ color: STRENGTH[strength].color }}>
                {STRENGTH[strength].label}
                {strength === 1 && " — daha uzun yap"}
                {strength === 2 && " — büyük harf + rakam ekle"}
              </p>
            </div>
          )}
        </div>

        {/* Şifre tekrar */}
        <div>
          <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-slate-300">
            Şifre tekrar
          </label>
          <input
            id="confirm"
            type={showPass ? "text" : "password"}
            placeholder="Şifreni tekrar gir"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={passInputCls}
          />
          <FieldHint
            show={confirm.length > 0}
            ok={confirmOk}
            msg={confirmOk ? "Şifreler eşleşiyor" : "Şifreler eşleşmiyor"}
          />
        </div>

        {/* Cinsiyet seçimi */}
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-300">Cinsiyet</span>
          <div className="grid grid-cols-3 gap-2">
            {genderOptions.map((opt) => {
              const active = gender === opt.value;
              const meta = GENDER_META[opt.value] ?? GENDER_META.other;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-xs font-semibold transition-all"
                  style={
                    active
                      ? {
                          borderColor: `${meta.accent}88`,
                          background: `${meta.accent}1a`,
                          color: meta.accent,
                          boxShadow: `0 0 18px -6px ${meta.accent}80`,
                        }
                      : { borderColor: "rgba(255,255,255,0.1)", color: "#94a3b8" }
                  }
                >
                  <span className={`text-lg ${active ? "" : "opacity-60 grayscale"}`}>
                    {meta.emoji}
                  </span>
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Anonim başla toggle */}
        <button
          type="button"
          onClick={() => setIsAnonymous((v) => !v)}
          role="switch"
          aria-checked={isAnonymous}
          className="flex w-full items-center justify-between gap-3 rounded-2xl border bg-white/[0.03] px-4 py-3 text-left transition-colors"
          style={{ borderColor: isAnonymous ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.1)" }}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-base">
              {isAnonymous ? "🕶️" : "👤"}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">Anonim başla</span>
              <span className="block text-xs text-slate-400">
                {isAnonymous
                  ? "Profilin gizli kalsın, kimliğin görünmesin."
                  : "Kullanıcı adın profil ve paylaşımlarında görünür."}
              </span>
            </span>
          </span>
          <span
            className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
            style={{ background: isAnonymous ? "#a855f7" : "rgba(255,255,255,0.15)" }}
          >
            <motion.span
              animate={{ x: isAnonymous ? 22 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
            />
          </span>
        </button>

        {/* Yaş onayı (18+) + sözleşme linkleri */}
        <label
          className="flex cursor-pointer items-start gap-3 rounded-2xl border bg-white/[0.03] px-4 py-3 transition-colors"
          style={{ borderColor: ageConfirmed ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.1)" }}
        >
          <input
            type="checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold transition-all"
            style={
              ageConfirmed
                ? { background: "linear-gradient(135deg, #34d399, #059669)", color: "#fff" }
                : { background: "rgba(255,255,255,0.08)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)" }
            }
          >
            {ageConfirmed ? "✓" : ""}
          </span>
          <span className="text-xs leading-relaxed text-slate-400">
            <span className="font-semibold text-slate-300">18 yaşından büyük</span> olduğumu,{" "}
            <Link
              href="/terms"
              target="_blank"
              className="font-semibold text-brand-300 underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Kullanım Şartları
            </Link>{" "}
            ve{" "}
            <Link
              href="/community-rules"
              target="_blank"
              className="font-semibold text-brand-300 underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Topluluk Kuralları
            </Link>
            &apos;nı kabul ettiğimi onaylıyorum.
          </span>
        </label>

        {/* Hesap oluştur */}
        <button
          type="submit"
          disabled={loading || !formReady}
          className="group relative w-full overflow-hidden rounded-full px-6 py-3.5 text-sm font-extrabold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #7c3aed 100%)",
            color: "#fff",
            boxShadow: "0 0 28px -8px rgba(168,85,247,0.7)",
          }}
        >
          {formReady && !loading && (
            <span aria-hidden className="pointer-events-none absolute inset-0">
              <motion.span
                animate={{ x: ["-120%", "220%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.6 }}
                className="absolute inset-y-0 w-1/3"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                }}
              />
            </span>
          )}
          <span className="relative inline-flex items-center gap-2" style={{ color: "#fff" }}>
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Oluşturuluyor...
              </>
            ) : !ageConfirmed && username && email && password ? (
              "Onay kutusunu işaretle"
            ) : (
              <>🚀 Hesap oluştur</>
            )}
          </span>
        </button>
      </form>
    </AuthShell>
  );
}
