"use client";

import { useEffect, useRef, useState, type FormEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { GolgeImage } from "@/components/golge/GolgeImage";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { moodTags } from "@/lib/moods";
import { overlayPositions, overlayStyles, packOverlay } from "@/lib/golge";
import { moderateText, MODERATION_BLOCK_MESSAGE } from "@/lib/moderation";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export default function NewGolgePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [overlayText, setOverlayText] = useState("");
  const [position, setPosition] = useState("center");
  const [style, setStyle] = useState("beyaz");
  const [caption, setCaption] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  // Varsayılan anonimlik = profil tercihi (bu paylaşım için yine değiştirilebilir).
  const defaultedAnon = useRef(false);
  useEffect(() => {
    if (profile && !defaultedAnon.current) {
      setIsAnonymous(profile.is_anonymous);
      defaultedAnon.current = true;
    }
  }, [profile]);

  // ObjectURL temizliği
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function pickFile(f: File | undefined | null) {
    setError(null);
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Yalnızca görsel dosyaları yükleyebilirsin.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("Görsel en fazla 10MB olabilir.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Lütfen bir görsel seç.");
      return;
    }
    if (!user) return;
    if (profile?.is_banned) {
      setError("Hesabınız topluluk kuralları nedeniyle kısıtlanmıştır.");
      return;
    }
    if (!moderateText(`${overlayText} ${caption}`).allowed) {
      setError(MODERATION_BLOCK_MESSAGE);
      return;
    }

    setUploading(true);

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("golge-media")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) {
      setUploading(false);
      setError("Görsel yüklenemedi. Lütfen tekrar dene.");
      return;
    }

    const { data: pub } = supabase.storage.from("golge-media").getPublicUrl(path);

    const { data: post, error: insErr } = await supabase
      .from("golge_posts")
      .insert({
        user_id: user.id,
        image_url: pub.publicUrl,
        caption: caption.trim() || null,
        overlay_text: overlayText.trim() || null,
        overlay_style: overlayText.trim() ? packOverlay(style, position) : null,
        mood_tag: mood,
        is_anonymous: isAnonymous,
      })
      .select("id")
      .single();

    setUploading(false);

    if (insErr) {
      // Rate limit trigger'ı Türkçe mesajla hata fırlatır
      setError(insErr.message?.includes("hızlı") ? insErr.message : "Paylaşım oluşturulamadı. Lütfen tekrar dene.");
      return;
    }

    success("Gölgen paylaşıldı! +200 puan kazandın 🎉");
    await refreshProfile();
    router.push(post ? `/golge/${post.id}` : "/golge");
  }

  if (authLoading || !user) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-4">
        <h1 className="mb-1 text-2xl font-extrabold text-white">Gölge Paylaş</h1>
        <p className="mb-5 text-sm text-slate-400">Bir fotoğraf, bir cümle. Gölgede kal.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}

          {/* Görsel seçimi / drag & drop */}
          {!previewUrl ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                dragging
                  ? "border-brand-500 bg-brand-500/10"
                  : "border-white/15 bg-white/[0.03] hover:bg-white/[0.05]"
              }`}
            >
              <span className="mb-2 text-3xl">🖼️</span>
              <p className="text-sm font-semibold text-white">
                Görseli sürükle bırak veya seç
              </p>
              <p className="mt-1 text-xs text-slate-500">PNG, JPG, WEBP, GIF · maks. 10MB</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Canlı overlay preview */}
              <GolgeImage
                imageUrl={previewUrl}
                overlayText={overlayText}
                overlay={packOverlay(style, position)}
                contain
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-brand-300 hover:text-brand-200"
              >
                Görseli değiştir
              </button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />

          {/* Overlay yazı */}
          <Input
            id="overlay"
            label="Görsel üstü yazı (isteğe bağlı)"
            placeholder="Kısa, vurucu bir cümle..."
            value={overlayText}
            maxLength={120}
            onChange={(e) => setOverlayText(e.target.value)}
          />

          {/* Yazı konumu */}
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">Yazı konumu</span>
            <div className="grid grid-cols-3 gap-2">
              {overlayPositions.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPosition(p.value)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${
                    position === p.value
                      ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                      : "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Yazı stili */}
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">Yazı stili</span>
            <div className="flex flex-wrap gap-2">
              {overlayStyles.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    style === s.value
                      ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Açıklama */}
          <Input
            id="caption"
            label="Açıklama (isteğe bağlı)"
            placeholder="Birkaç kelime..."
            value={caption}
            maxLength={300}
            onChange={(e) => setCaption(e.target.value)}
          />

          {/* Mood */}
          <div>
            <span className="mb-2 block text-sm font-medium text-slate-300">
              Ruh hali (isteğe bağlı)
            </span>
            <div className="flex flex-wrap gap-2">
              {moodTags.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mood === m.value
                      ? "border-brand-500/60 bg-brand-500/15 text-brand-100"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <span>{m.emoji}</span>
                  {m.value}
                </button>
              ))}
            </div>
          </div>

          {/* Anonim toggle */}
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-medium text-white">Anonim paylaş</span>
              <span className="block text-xs text-slate-400">
                {isAnonymous ? "'Anonim Kullanıcı' olarak görünür." : "Kullanıcı adın görünür."}
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

          <Button type="submit" disabled={uploading} className="w-full">
            {uploading ? "Paylaşılıyor..." : "Paylaş"}
          </Button>
        </form>
      </div>
    </Container>
  );
}
