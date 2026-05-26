"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/lib/supabaseClient";

const CONFIRM_TEXT = "HESABIMI SİL";

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  async function handleDelete() {
    setError(null);
    if (confirmText.trim() !== CONFIRM_TEXT) {
      setError(`Onaylamak için "${CONFIRM_TEXT}" yazmalısın.`);
      return;
    }
    setBusy(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setBusy(false);
      setError("Oturum bulunamadı. Tekrar giriş yap.");
      return;
    }
    const res = await fetch("/api/account/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "user_request" }),
    });
    if (!res.ok) {
      setBusy(false);
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Hesap silinemedi. Lütfen tekrar dene.");
      return;
    }
    await signOut();
    router.replace("/");
  }

  return (
    <Container>
      <div className="space-y-5 py-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Hesap Ayarları</h1>
          <p className="mt-1 text-sm text-slate-400">Hesabını ve gizlilik ayarlarını yönet.</p>
        </div>

        <Link href="/settings/blocked-users" className="card card-hover flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-semibold text-white">Engellenen kullanıcılar</p>
            <p className="text-xs text-slate-400">Engellediğin kişileri görüntüle ve yönet.</p>
          </div>
          <span className="text-brand-300">→</span>
        </Link>

        {/* Tehlikeli alan: hesap silme */}
        <div className="rounded-2xl border border-red-500/40 bg-red-500/[0.06] p-5">
          <h2 className="text-sm font-bold text-red-200">Tehlikeli Alan</h2>
          <p className="mt-1 text-xs text-red-200/80">
            Hesabını silersen tüm itirafların, Gölge paylaşımların, mesajların, takip ve rozet
            verilerin <strong>kalıcı olarak</strong> silinir. Bu işlem geri alınamaz.
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setConfirmText("");
              setError(null);
            }}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-red-500/90 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-500"
          >
            Hesabımı Sil
          </button>
        </div>
      </div>

      {/* Onay modalı */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setOpen(false);
          }}
        >
          <div className="card w-full max-w-md border-red-500/40 p-6">
            <h3 className="text-lg font-bold text-white">Hesabını silmek üzeresin</h3>
            <p className="mt-2 text-sm text-slate-300">
              Bu işlem <strong className="text-red-300">geri alınamaz</strong>. Tüm verilerin kalıcı
              olarak silinecek.
            </p>
            <p className="mt-4 text-xs text-slate-400">
              Onaylamak için aşağıya <strong className="text-white">{CONFIRM_TEXT}</strong> yaz:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TEXT}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-red-500/60"
            />
            {error && (
              <div className="mt-3">
                <Alert tone="error">{error}</Alert>
              </div>
            )}
            <div className="mt-5 flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1"
              >
                Vazgeç
              </Button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy || confirmText.trim() !== CONFIRM_TEXT}
                className="flex-1 rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {busy ? "Siliniyor..." : "Kalıcı olarak sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
