"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.includes("@")) {
      setError("Geçerli bir e-posta adresi gir.");
      return;
    }

    setLoading(true);
    const result = await resetPassword(email.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      title="Şifreni mi unuttun?"
      subtitle="E-posta adresini gir, sıfırlama bağlantısını gönderelim."
      footer={
        <>
          Şifreni hatırladın mı?{" "}
          <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
            Giriş yap
          </Link>
        </>
      }
    >
      {sent ? (
        <Alert tone="success">
          Eğer bu e-posta ile bir hesap varsa, sıfırlama bağlantısı gönderildi.
          Gelen kutunu (ve spam klasörünü) kontrol et.
        </Alert>
      ) : (
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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
