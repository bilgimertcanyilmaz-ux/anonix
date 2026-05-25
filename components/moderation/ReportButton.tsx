"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { Button } from "@/components/ui/Button";
import { FlagIcon } from "@/components/ui/icons";

export const REPORT_REASONS = [
  "Hakaret / Küfür",
  "Tehdit",
  "İfşa / Kişisel Bilgi",
  "Telefon / Adres Paylaşımı",
  "Yasa Dışı İçerik",
  "Taciz",
  "Spam",
  "Kendine zarar verme riski",
  "Diğer",
];

interface ReportButtonProps {
  entityType: "confession" | "confession_comment" | "golge" | "golge_comment";
  entityId: string;
  reportedUserId: string;
  /** Sadece ikon mu, ikon+metin mi. */
  compact?: boolean;
}

export function ReportButton({ entityType, entityId, reportedUserId, compact }: ReportButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Kendi içeriğini şikayet butonunu gizle
  if (user && user.id === reportedUserId) return null;

  function handleOpen(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toastError("Şikayet etmek için giriş yapmalısın.");
      router.push("/login");
      return;
    }
    setOpen(true);
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      entity_type: entityType,
      entity_id: entityId,
      reason,
      description: description.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toastError("Bu içeriği zaten şikayet ettin.");
      } else {
        toastError("Şikayet gönderilemedi. Lütfen tekrar dene.");
      }
      setOpen(false);
      return;
    }
    success("Şikayetin alındı. Teşekkürler — ekibimiz inceleyecek.");
    setOpen(false);
    setDescription("");
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label="Şikayet et"
        className="inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-red-300"
      >
        <FlagIcon className="h-4 w-4" />
        {!compact && "Şikayet"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="card w-full max-w-md p-5">
            <h3 className="mb-1 text-lg font-bold text-white">İçeriği şikayet et</h3>
            <p className="mb-4 text-xs text-slate-400">
              Şikayet nedenini seç. Tüm şikayetler gizli tutulur.
            </p>

            <label className="mb-1 block text-sm font-medium text-slate-300">Neden</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/60"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium text-slate-300">
              Açıklama (isteğe bağlı)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Ek detay..."
              className="mb-4 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
            />

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="flex-1">
                Vazgeç
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                {submitting ? "Gönderiliyor..." : "Şikayet et"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
