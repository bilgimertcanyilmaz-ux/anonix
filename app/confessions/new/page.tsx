"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { moodTags } from "@/lib/moods";
import { moderateText, MODERATION_BLOCK_MESSAGE } from "@/lib/moderation";

const MIN = 10;
const MAX = 1000;

export default function NewConfessionPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isTemporary, setIsTemporary] = useState(false);
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
    if (!moderateText(text).allowed) {
      setError(MODERATION_BLOCK_MESSAGE);
      return;
    }

    setSubmitting(true);
    const { data, error: insertError } = await supabase
      .from("confessions")
      .insert({
        user_id: user!.id,
        content: text,
        mood_tag: mood,
        is_anonymous: isAnonymous,
        is_temporary: isTemporary,
        expires_at: isTemporary ? new Date(Date.now() + 24 * 3600 * 1000).toISOString() : null,
      })
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

          {/* Ruh hali etiketi */}
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Ruh hali (isteğe bağlı)
            </span>
            <div className="flex flex-wrap gap-2">
              {moodTags.map((m) => {
                const active = mood === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(active ? null : m.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{m.emoji}</span>
                    {m.value}
                  </button>
                );
              })}
            </div>
          </div>

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
