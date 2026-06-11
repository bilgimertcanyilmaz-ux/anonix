"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { CATEGORIES } from "@/lib/categories";
import { canUseFeature } from "@/lib/subscription";
import { LOUNGE_ROOMS } from "@/lib/lounge";
import { moderateText, MODERATION_BLOCK_MESSAGE } from "@/lib/moderation";

const MIN = 10;
const MAX = 10000;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 24, delay: i * 0.06 },
  }),
};

/** Ortak ayar satırı: ikon balonu + başlık/açıklama + yaylı anahtar. */
function ToggleRow({
  icon,
  iconBg,
  title,
  desc,
  on,
  onToggle,
  accent = "#a855f7",
  children,
}: {
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  accent?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border bg-white/[0.03] transition-colors"
      style={{ borderColor: on ? `${accent}55` : "rgba(255,255,255,0.08)" }}
    >
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={on}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${iconBg}`}
          >
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">{title}</span>
            <span className="block text-xs text-slate-400">{desc}</span>
          </span>
        </span>
        <span
          className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
          style={{ background: on ? accent : "rgba(255,255,255,0.15)" }}
        >
          <motion.span
            animate={{ x: on ? 22 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
          />
        </span>
      </button>
      {children}
    </div>
  );
}

export default function NewConfessionPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { success } = useToast();

  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isTemporary, setIsTemporary] = useState(false);
  const [plusRoom, setPlusRoom] = useState<string | null>(null);
  const canLounge = canUseFeature(profile, "plus_lounge");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Giriş yapmamış kullanıcıyı login'e yönlendir.
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Varsayılan anonimlik = profil tercihi (kullanıcı yine de bu paylaşım için değiştirebilir).
  const defaultedAnon = useRef(false);
  useEffect(() => {
    if (profile && !defaultedAnon.current) {
      setIsAnonymous(profile.is_anonymous);
      defaultedAnon.current = true;
    }
  }, [profile]);

  if (authLoading || !user) {
    return (
      <Container className="max-w-xl">
        <div className="space-y-4 py-6">
          <div className="h-8 w-44 animate-pulse rounded-full bg-white/10" />
          <div className="card h-48 animate-pulse" />
          <div className="card h-12 animate-pulse" />
          <div className="card h-14 animate-pulse" />
          <div className="card h-14 animate-pulse" />
        </div>
      </Container>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (profile?.is_banned) {
      setError("Hesabınız topluluk kuralları nedeniyle kısıtlanmıştır.");
      return;
    }

    const text = content.trim();
    if (text.length < MIN) {
      setError(`İtiraf en az ${MIN} karakter olmalı.`);
      return;
    }
    if (text.length > MAX) {
      setError(`İtiraf en fazla ${MAX} karakter olabilir.`);
      return;
    }
    const mod = moderateText(text);
    if (!mod.allowed) {
      setError(
        mod.reasons.length
          ? `${MODERATION_BLOCK_MESSAGE} (Tespit edilen: ${mod.reasons.join(", ")})`
          : MODERATION_BLOCK_MESSAGE
      );
      return;
    }

    setSubmitting(true);
    const payload: Record<string, unknown> = {
      user_id: user!.id,
      content: text,
      // Kategori = mood_tag (geriye dönük uyumluluk için ikisi de yazılır)
      category: category,
      mood_tag: category,
      is_anonymous: isAnonymous,
      is_temporary: isTemporary,
      expires_at: isTemporary ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null,
    };
    // Ultra Plus özel oda — yalnızca seçiliyse ekle (kolon yoksa normal akış bozulmasın)
    if (canLounge && plusRoom) payload.plus_room_type = plusRoom;

    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert(payload)
      .select("id")
      .single();
    setSubmitting(false);

    if (insertError) {
      setError("İtiraf paylaşılamadı. Lütfen tekrar dene.");
      return;
    }

    success("İtirafın paylaşıldı! +150 puan kazandın 🎉");
    await refreshProfile();
    router.push(data ? `/confessions/${data.id}` : "/confessions");
  }

  const length = content.trim().length;
  const tooShort = length > 0 && length < MIN;
  const ready = length >= MIN && length <= MAX;
  const nearLimit = length > MAX * 0.9;

  return (
    <Container className="max-w-xl">
      <div className="py-4">
        {/* ── BAŞLIK ─────────────────────────────────────────────── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
                <motion.span
                  aria-hidden
                  animate={{ rotate: [-8, 6, -8] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-2xl"
                >
                  ✍️
                </motion.span>
                <span
                  style={{
                    background: "linear-gradient(135deg, #fff 0%, #e9d5ff 50%, #c084fc 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 14px rgba(168,85,247,0.35))",
                  }}
                  className="hero-title"
                >
                  İtiraf Yaz
                </span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">İçini dök. Kimliğin senin kontrolünde.</p>
            </div>
            <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-500/15 px-3 py-1.5 text-[11px] font-bold text-brand-200 ring-1 ring-inset ring-brand-400/30">
              ⭐ +150 puan
            </span>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
              <Alert tone="error">{error}</Alert>
            </motion.div>
          )}

          {/* ── KOMPOZER ─────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="glass-card relative overflow-hidden p-1.5"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX}
              rows={7}
              autoFocus
              placeholder="Bugün içinden geçeni anonim olarak paylaş... Kimse kim olduğunu bilmeyecek."
              className="w-full resize-none rounded-[1.25rem] bg-transparent px-4 py-3.5 text-[15px] leading-relaxed text-white placeholder:text-slate-500 outline-none"
            />
            {/* Alt bilgi çubuğu */}
            <div className="flex items-center justify-between gap-2 border-t border-white/5 px-4 py-2">
              <span
                className={`text-[11px] font-semibold transition-colors ${
                  tooShort ? "text-red-300" : ready ? "text-emerald-300" : "text-slate-500"
                }`}
              >
                {tooShort
                  ? `✏️ En az ${MIN} karakter (${MIN - length} kaldı)`
                  : ready
                    ? "✓ Paylaşıma hazır"
                    : "Düşüncelerini özgürce yaz"}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                  nearLimit
                    ? "bg-red-500/15 text-red-300"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                {length.toLocaleString("tr-TR")}/{MAX.toLocaleString("tr-TR")}
              </span>
            </div>
          </motion.div>

          {/* ── KATEGORİ ─────────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={2}>
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-300">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 text-xs">
                🏷️
              </span>
              Kategori <span className="font-normal text-slate-500">(isteğe bağlı)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <motion.button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(active ? null : c.value)}
                    whileTap={{ scale: 0.94 }}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "border-transparent text-white shadow-glow-sm"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                    style={
                      active
                        ? { background: "linear-gradient(135deg, #a855f7, #7c3aed)" }
                        : undefined
                    }
                  >
                    <span>{c.emoji}</span>
                    {c.value}
                    {active && <span className="text-[10px]">✓</span>}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* ── AYARLAR ──────────────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={3}
            className="space-y-3"
          >
            {/* Ultra Plus: özel odada paylaş */}
            {canLounge && (
              <ToggleRow
                icon="⚡"
                iconBg="bg-amber-400/15"
                title="Ultra Plus özel odada paylaş"
                desc={plusRoom ? `Oda: ${plusRoom}` : "Yalnızca Ultra Plus üyeler görür."}
                on={!!plusRoom}
                onToggle={() => setPlusRoom((v) => (v ? null : LOUNGE_ROOMS[0]))}
                accent="#f59e0b"
              >
                {plusRoom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-wrap gap-2 px-4 pb-3"
                  >
                    {LOUNGE_ROOMS.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setPlusRoom(r)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          plusRoom === r
                            ? "border-amber-400/60 bg-amber-400/15 text-amber-100"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </motion.div>
                )}
              </ToggleRow>
            )}

            {/* Anonimlik */}
            <ToggleRow
              icon={isAnonymous ? "🕶️" : "👤"}
              iconBg="bg-brand-500/15"
              title="Anonim paylaş"
              desc={
                isAnonymous
                  ? "Adın gizli kalacak — 'Anonim Kullanıcı' olarak görünür."
                  : "Kullanıcı adın itirafla birlikte görünecek."
              }
              on={isAnonymous}
              onToggle={() => setIsAnonymous((v) => !v)}
            />

            {/* Kaybolan itiraf */}
            <ToggleRow
              icon="⏳"
              iconBg="bg-indigo-500/15"
              title="24 saatte kaybol"
              desc={
                isTemporary ? "İtirafın 24 saat sonra otomatik silinecek." : "Kalıcı paylaşım."
              }
              on={isTemporary}
              onToggle={() => setIsTemporary((v) => !v)}
              accent="#818cf8"
            />
          </motion.div>

          {/* ── PAYLAŞ ───────────────────────────────────────────── */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}>
            <button
              type="submit"
              disabled={submitting || !ready}
              className="group relative w-full overflow-hidden rounded-full px-6 py-3.5 text-sm font-extrabold text-white shadow-glow transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #7c3aed 100%)" }}
            >
              {ready && !submitting && (
                <span aria-hidden className="pointer-events-none absolute inset-0">
                  <motion.span
                    animate={{ x: ["-120%", "220%"] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.6 }}
                    className="absolute inset-y-0 w-1/3"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                    }}
                  />
                </span>
              )}
              <span className="relative inline-flex items-center gap-2">
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Paylaşılıyor...
                  </>
                ) : !ready && length > 0 ? (
                  `En az ${MIN} karakter yaz`
                ) : (
                  <>🚀 Paylaş</>
                )}
              </span>
            </button>
            <p className="mt-2.5 text-center text-[11px] text-slate-500">
              Paylaşımlar topluluk kurallarına göre denetlenir · Kimliğin asla ifşa edilmez
            </p>
          </motion.div>
        </form>
      </div>
    </Container>
  );
}
