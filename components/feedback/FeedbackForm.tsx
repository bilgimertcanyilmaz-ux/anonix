"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/auth/AuthProvider";
import { submitFeedback } from "@/lib/feedback";
import type { FeedbackKind } from "@/types";

const KINDS: { value: FeedbackKind; label: string; icon: string }[] = [
  { value: "feedback", label: "Genel", icon: "💬" },
  { value: "bug", label: "Hata", icon: "🐞" },
  { value: "idea", label: "Fikir", icon: "💡" },
];

/** Geri bildirim / hata / fikir gönderme formu. */
export function FeedbackForm({
  defaultKind = "feedback",
  onSent,
}: {
  defaultKind?: FeedbackKind;
  onSent?: () => void;
}) {
  const { user } = useAuth();
  const [kind, setKind] = useState<FeedbackKind>(defaultKind);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (message.trim().length < 5) {
      setError("Lütfen en az 5 karakter yaz.");
      return;
    }
    setSending(true);
    const res = await submitFeedback({ kind, message, userId: user?.id ?? null });
    setSending(false);
    if (res.error) {
      setError("Gönderilemedi, lütfen tekrar dene.");
      return;
    }
    setSent(true);
    onSent?.();
  }

  if (sent) {
    return (
      <Alert tone="success">
        Teşekkürler! Geri bildirimin bize ulaştı. 🙌
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((k) => {
          const active = kind === k.value;
          return (
            <button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                  : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
              }`}
            >
              <span className="mr-1">{k.icon}</span>
              {k.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="fb-message" className="block text-sm font-medium text-slate-300">
          {kind === "bug"
            ? "Ne ters gitti? (adımlar varsa yaz)"
            : kind === "idea"
              ? "Aklındaki fikir nedir?"
              : "Bize ne söylemek istersin?"}
        </label>
        <textarea
          id="fb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={1500}
          rows={5}
          placeholder="Düşünceni paylaş..."
          className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-brand-500/60"
        />
        <p className="text-right text-[11px] text-slate-500">{message.length}/1500</p>
      </div>

      <Button type="submit" disabled={sending} className="w-full">
        {sending ? "Gönderiliyor..." : "Gönder"}
      </Button>
      <p className="text-center text-[11px] text-slate-500">
        Geri bildiriminle Anonix&apos;i birlikte iyileştiriyoruz.
      </p>
    </form>
  );
}
