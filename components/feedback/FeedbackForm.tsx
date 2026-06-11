"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/components/auth/AuthProvider";
import { submitFeedback } from "@/lib/feedback";
import type { FeedbackKind } from "@/types";

const MIN = 5;
const MAX = 1500;

const KINDS: {
  value: FeedbackKind;
  label: string;
  icon: string;
  desc: string;
  accent: string;
  gradient: string;
}[] = [
  {
    value: "feedback",
    label: "Genel",
    icon: "💬",
    desc: "Görüş & öneri",
    accent: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7, #7c3aed)",
  },
  {
    value: "bug",
    label: "Hata",
    icon: "🐞",
    desc: "Bir şey bozuk",
    accent: "#ef4444",
    gradient: "linear-gradient(135deg, #ef4444, #b91c1c)",
  },
  {
    value: "idea",
    label: "Fikir",
    icon: "💡",
    desc: "Yeni özellik",
    accent: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
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

  const active = KINDS.find((k) => k.value === kind) ?? KINDS[0];
  const length = message.trim().length;
  const ready = length >= MIN;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (length < MIN) {
      setError(`Lütfen en az ${MIN} karakter yaz.`);
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

  /* ── Başarı ekranı — kutlamalı ─────────────────────────────── */
  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <motion.span
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(5,150,105,0.15))",
            boxShadow: "0 0 32px -6px rgba(16,185,129,0.6), inset 0 0 0 1.5px rgba(52,211,153,0.5)",
          }}
        >
          🎉
        </motion.span>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-base font-bold text-white"
        >
          Teşekkürler!
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-slate-400"
        >
          Geri bildirimin bize ulaştı — birlikte daha iyiye. 💜
        </motion.p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      {/* ── Tür kartları ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {KINDS.map((k) => {
          const isActive = kind === k.value;
          return (
            <motion.button
              key={k.value}
              type="button"
              onClick={() => setKind(k.value)}
              whileTap={{ scale: 0.95 }}
              className="relative flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 transition-all"
              style={
                isActive
                  ? {
                      borderColor: `${k.accent}88`,
                      background: `${k.accent}1a`,
                      boxShadow: `0 0 20px -6px ${k.accent}80`,
                    }
                  : { borderColor: "rgba(255,255,255,0.08)" }
              }
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-transform"
                style={{
                  background: isActive ? k.gradient : "rgba(255,255,255,0.05)",
                  transform: isActive ? "scale(1.05)" : undefined,
                }}
              >
                {k.icon}
              </span>
              <span
                className="text-xs font-bold"
                style={{ color: isActive ? k.accent : "#94a3b8" }}
              >
                {k.label}
              </span>
              <span className={`text-[9px] ${isActive ? "text-slate-300" : "text-slate-600"}`}>
                {k.desc}
              </span>
              {isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold"
                  style={{ background: k.gradient, color: "#fff" }}
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Mesaj kompozeri ──────────────────────────────────── */}
      <div
        className="overflow-hidden rounded-2xl border bg-white/[0.03] transition-colors"
        style={{ borderColor: length > 0 ? `${active.accent}55` : "rgba(255,255,255,0.1)" }}
      >
        <textarea
          id="fb-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={MAX}
          rows={5}
          autoFocus
          placeholder={
            kind === "bug"
              ? "Ne ters gitti? Adımları yazarsan daha hızlı çözeriz..."
              : kind === "idea"
                ? "Aklındaki fikri anlat — küçük büyük fark etmez..."
                : "Bize ne söylemek istersin? Düşünceni paylaş..."
          }
          className="w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-500 outline-none"
        />
        <div className="flex items-center justify-between gap-2 border-t border-white/5 px-3 py-2">
          <span
            className={`text-[11px] font-semibold ${
              length > 0 && !ready ? "text-red-300" : ready ? "text-emerald-300" : "text-slate-500"
            }`}
          >
            {length > 0 && !ready
              ? `En az ${MIN} karakter (${MIN - length} kaldı)`
              : ready
                ? "✓ Göndermeye hazır"
                : `${active.icon} ${active.label} bildirimi`}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
              message.length > MAX * 0.9 ? "bg-red-500/15 text-red-300" : "bg-white/5 text-slate-500"
            }`}
          >
            {message.length}/{MAX}
          </span>
        </div>
      </div>

      {/* ── Gönder — tür rengine bürünür ─────────────────────── */}
      <button
        type="submit"
        disabled={sending || !ready}
        className="group relative w-full overflow-hidden rounded-full px-6 py-3 text-sm font-extrabold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: active.gradient, color: "#fff", boxShadow: `0 0 24px -8px ${active.accent}` }}
      >
        {ready && !sending && (
          <span aria-hidden className="pointer-events-none absolute inset-0">
            <motion.span
              animate={{ x: ["-120%", "220%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.5 }}
              className="absolute inset-y-0 w-1/3"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
              }}
            />
          </span>
        )}
        <span className="relative inline-flex items-center gap-2" style={{ color: "#fff" }}>
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Gönderiliyor...
            </>
          ) : (
            <>📨 Gönder</>
          )}
        </span>
      </button>
      <p className="text-center text-[11px] text-slate-500">
        Geri bildiriminle Anonix&apos;i birlikte iyileştiriyoruz. 💜
      </p>
    </form>
  );
}
