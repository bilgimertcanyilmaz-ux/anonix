"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Canlı doğrulama
  const emailOk = /\S+@\S+\.\S+/.test(email.trim());
  const formReady = emailOk && password.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }
    if (!password) {
      setError("Şifreni gir.");
      return;
    }

    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/");
  }

  return (
    <AuthShell
      title="Tekrar hoş geldin"
      subtitle="Hesabına giriş yap ve kaldığın yerden devam et."
      footer={
        <>
          Hesabın yok mu?{" "}
          <Link href="/register" className="font-semibold text-brand-300 hover:text-brand-200">
            Kayıt ol
          </Link>
        </>
      }
    >
      <OAuthButtons />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        {/* E-posta + canlı ipucu */}
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
          {email.length > 0 && (
            <p className={`mt-1 text-[11px] ${emailOk ? "text-emerald-300" : "text-red-300"}`}>
              {emailOk ? "✓ Geçerli adres" : "✕ Geçerli bir e-posta gir"}
            </p>
          )}
        </div>

        {/* Şifre + göster/gizle */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-300">
            Şifre
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              placeholder="Şifreni gir"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-16 text-sm text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-500/60 focus:bg-white/[0.06] focus:ring-2 focus:ring-brand-500/20"
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
        </div>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-slate-400 transition-colors hover:text-brand-300"
          >
            Şifremi unuttum
          </Link>
        </div>

        {/* Giriş yap */}
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
                Giriş yapılıyor...
              </>
            ) : (
              <>🔑 Giriş yap</>
            )}
          </span>
        </button>
      </form>
    </AuthShell>
  );
}
