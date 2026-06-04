"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
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

export default function NewConfessionPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

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
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
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

  return (
    <Container>
      <div className="py-4">
        <h1 className="mb-1 text-2xl font-extrabold text-white">İtiraf Yaz</h1>
        <p className="mb-5 text-sm text-slate-400">
          İçini dök. Kimliğin senin kontrolünde.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}

          {/* İtiraf metni */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={MAX}
              rows={6}
              placeholder="Bugün içinden geçeni anonim olarak paylaş..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[15px] leading-relaxed text-white placeholder:text-slate-500 outline-none transition-colors focus:border-brand-500/60 focus:bg-white/[0.06]"
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={tooShort ? "text-red-300" : "text-slate-500"}>
                {tooShort ? `En az ${MIN} karakter` : " "}
              </span>
              <span className="text-slate-500">
                {length}/{MAX}
              </span>
            </div>
          </div>

          {/* Kategori seçimi */}
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Kategori (isteğe bağlı)
            </span>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const active = category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(active ? null : c.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{c.emoji}</span>
                    {c.value}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ultra Plus: özel odada paylaş */}
          {canLounge && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-3">
              <button
                type="button"
                onClick={() => setPlusRoom((v) => (v ? null : LOUNGE_ROOMS[0]))}
                className="flex w-full items-center justify-between text-left"
              >
                <span>
                  <span className="block text-sm font-semibold text-amber-100">
                    ⚡ Ultra Plus özel odada paylaş
                  </span>
                  <span className="block text-xs text-amber-100/60">
                    Yalnızca Ultra Plus üyeler görür.
                  </span>
                </span>
                <span
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${plusRoom ? "bg-amber-500" : "bg-white/15"}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${plusRoom ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </span>
              </button>
              {plusRoom && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {LOUNGE_ROOMS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setPlusRoom(r)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                        plusRoom === r
                          ? "border-amber-400/60 bg-amber-400/15 text-amber-100"
                          : "border-white/10 bg-white/[0.03] text-slate-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Anonim paylaş toggle */}
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-medium text-white">Anonim paylaş</span>
              <span className="block text-xs text-slate-400">
                {isAnonymous
                  ? "Adın gizli kalacak — 'Anonim Kullanıcı' olarak görünür."
                  : "Kullanıcı adın itirafla birlikte görünecek."}
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

          {/* Kaybolan itiraf toggle */}
          <button
            type="button"
            onClick={() => setIsTemporary((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-medium text-white">⏳ 24 saatte kaybol</span>
              <span className="block text-xs text-slate-400">
                {isTemporary
                  ? "İtirafın 24 saat sonra otomatik silinecek."
                  : "Kalıcı paylaşım."}
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                isTemporary ? "bg-brand-500" : "bg-white/15"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  isTemporary ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </button>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Paylaşılıyor..." : "Paylaş"}
          </Button>
        </form>
      </div>
    </Container>
  );
}
