"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
          placeholder="Şifreni gir"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-slate-400 hover:text-brand-300"
          >
            Şifremi unuttum
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Giriş yapılıyor..." : "Giriş yap"}
        </Button>
      </form>
    </AuthShell>
  );
}
