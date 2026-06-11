"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { canUseFeature } from "@/lib/subscription";
import {
  PREMIUM_THEMES,
  type PremiumTheme,
  isThemeUnlocked,
  themeLockLabel,
  getPremiumTheme,
} from "@/lib/themes";
import { FramedAvatar } from "@/components/profile/FramedAvatar";

/** Avatar içeriği — görsel ya da baş harf. */
function AvatarInner({
  avatarUrl,
  username,
  textSize = "text-lg",
}: {
  avatarUrl?: string | null;
  username?: string | null;
  textSize?: string;
}) {
  return avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-accent-500 font-extrabold text-white ${textSize}`}
    >
      {username?.[0]?.toUpperCase() ?? "A"}
    </div>
  );
}

/** Tek bir tema kartı — çerçeveyi (içinde avatarla) sergiler. */
function ThemeCard({
  theme,
  selected,
  disabled,
  lockText = "🔒 Kilitli",
  avatarUrl,
  username,
  onPick,
}: {
  theme: PremiumTheme;
  selected: boolean;
  disabled: boolean;
  lockText?: string;
  avatarUrl?: string | null;
  username?: string | null;
  onPick: () => void;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onPick}
      whileHover={disabled ? undefined : { y: -4, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative flex h-[190px] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl p-3 transition-all"
      style={{
        background:
          "linear-gradient(180deg, rgba(30,27,75,0.55) 0%, rgba(13,9,30,0.88) 100%)",
        border: `1.5px solid ${selected ? theme.accent : "rgba(255,255,255,0.08)"}`,
        boxShadow: selected
          ? `0 0 30px -4px ${theme.accent}, inset 0 1px 0 rgba(255,255,255,0.1)`
          : "0 4px 24px -8px rgba(0,0,0,0.4)",
      }}
    >
      {/* Çerçeve önizlemesi */}
      <div
        className={`pointer-events-none relative z-10 transition-all duration-300 group-hover:scale-105 ${
          disabled ? "opacity-60 saturate-50" : ""
        }`}
        style={{ filter: disabled ? undefined : `drop-shadow(0 0 14px ${theme.accent}80)` }}
        aria-hidden
      >
        <FramedAvatar themeId={theme.id} size={118}>
          <AvatarInner avatarUrl={avatarUrl} username={username} />
        </FramedAvatar>
      </div>

      {/* Seçilide nazikçe nefes alan aura */}
      {selected && (
        <motion.span
          aria-hidden
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background: `radial-gradient(circle at 50% 32%, ${theme.accent}33, transparent 70%)`,
          }}
        />
      )}

      {/* İsim + durum */}
      <div className="relative z-10 w-full text-center">
        <p
          className="truncate text-[13px] font-extrabold tracking-tight"
          style={{
            color: "#fff",
            textShadow: `0 1px 4px rgba(0,0,0,0.7), 0 0 12px ${theme.accent}80`,
          }}
        >
          {theme.name}
        </p>
        {selected && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
            style={{
              background: `${theme.accent}33`,
              color: theme.accent,
              border: `1px solid ${theme.accent}80`,
            }}
          >
            ✓ Seçili
          </motion.span>
        )}
      </div>

      {/* Kilit şeridi */}
      {disabled && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-black/85 to-transparent px-2 pb-2 pt-6">
          <span className="max-w-full truncate rounded-full bg-black/70 px-3 py-1 text-center text-[10px] font-bold text-amber-300 ring-1 ring-inset ring-amber-400/30">
            {lockText}
          </span>
        </div>
      )}
    </motion.button>
  );
}

export default function ThemesSettingsPage() {
  const router = useRouter();
  const { user, profile, loading, updateProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const allowed = canUseFeature(profile, "premium_themes");
  const [category, setCategory] = useState<"rank" | "plus">("rank");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || !profile) {
    return (
      <Container className="max-w-lg">
        <div className="space-y-4 py-6">
          <div className="card h-36 animate-pulse" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-[190px] animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        </div>
      </Container>
    );
  }

  const current = profile.premium_theme;
  const currentTheme = getPremiumTheme(current);
  const rankThemes = PREMIUM_THEMES.filter((t) => t.unlockPoints !== undefined);
  const plusThemes = PREMIUM_THEMES.filter((t) => t.unlockPoints === undefined);
  const shown = category === "rank" ? rankThemes : plusThemes;
  const unlockedCount = (list: PremiumTheme[]) =>
    list.filter((t) => isThemeUnlocked(t, profile.points, allowed)).length;

  async function pick(id: string | null) {
    const res = await updateProfile({ premium_theme: id });
    if (res.error) toastError("Tema kaydedilemedi.");
    else success(id ? "Premium tema uygulandı 🎨" : "Tema kaldırıldı");
  }

  return (
    <Container className="max-w-lg">
      <div className="py-4">
        {/* ── BAŞLIK ─────────────────────────────────────────────── */}
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-title mb-1 text-3xl font-extrabold tracking-tight"
          style={{
            background: "linear-gradient(135deg, #fff 0%, #e9d5ff 50%, #c084fc 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 12px rgba(168,85,247,0.4))",
          }}
        >
          Premium Temalar
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-5 text-sm text-slate-400"
        >
          Rütbe çerçeveleri rütbe atladıkça açılır; özel çerçeveler Ultra Plus ile.
        </motion.p>

        {/* ── AKTİF ÇERÇEVE ÖNİZLEME ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: "spring", stiffness: 240, damping: 24 }}
          className="anonix-dark-card relative mb-6 flex items-center gap-4 overflow-hidden rounded-3xl border p-4 sm:p-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(76,29,149,0.45) 0%, rgba(15,12,36,0.92) 100%)",
            borderColor: currentTheme ? `${currentTheme.accent}55` : "rgba(255,255,255,0.1)",
            boxShadow: currentTheme
              ? `0 0 36px -10px ${currentTheme.accent}90`
              : "0 4px 24px -8px rgba(0,0,0,0.4)",
          }}
        >
          <motion.div
            aria-hidden
            animate={{ opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle, ${currentTheme ? currentTheme.accent : "#a855f7"}55, transparent 70%)`,
            }}
          />
          <div className="relative shrink-0">
            {currentTheme ? (
              <FramedAvatar themeId={currentTheme.id} size={96}>
                <AvatarInner avatarUrl={profile.avatar_url} username={profile.username} />
              </FramedAvatar>
            ) : (
              <div
                className="overflow-hidden rounded-full p-[2.5px]"
                style={{ background: "linear-gradient(135deg, #a855f7, #ec4899)" }}
              >
                <div className="h-[72px] w-[72px] overflow-hidden rounded-full">
                  <AvatarInner
                    avatarUrl={profile.avatar_url}
                    username={profile.username}
                    textSize="text-2xl"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="relative min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
              Aktif çerçeven
            </p>
            <p className="truncate text-lg font-extrabold text-white">
              {currentTheme ? currentTheme.name : "Çerçeve yok"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {currentTheme
                ? "Profilinde ve yorumlarında görünüyor."
                : "Aşağıdan bir çerçeve seç, profilin parlasın."}
            </p>
            {current && (
              <button
                type="button"
                onClick={() => pick(null)}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                ✕ Kaldır
              </button>
            )}
          </div>
        </motion.div>

        {/* ── KATEGORİ SEGMENTİ ─────────────────────────────────── */}
        <div className="mb-4 flex rounded-full border border-white/10 bg-white/[0.04] p-1">
          {([
            {
              key: "rank" as const,
              label: "🏅 Rütbe",
              count: `${unlockedCount(rankThemes)}/${rankThemes.length}`,
            },
            {
              key: "plus" as const,
              label: "✨ Özel",
              count: `${unlockedCount(plusThemes)}/${plusThemes.length}`,
            },
          ]).map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={`relative flex-1 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
                category === c.key ? "text-white" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {category === c.key && (
                <motion.span
                  layoutId="theme-cat-pill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 shadow-glow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative">
                {c.label}{" "}
                <span className={category === c.key ? "text-white/70" : "text-slate-500"}>
                  {c.count}
                </span>
              </span>
            </button>
          ))}
        </div>

        {category === "plus" && !allowed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/[0.08] p-4 backdrop-blur-md"
            style={{ boxShadow: "0 0 24px -8px rgba(252,211,77,0.4)" }}
          >
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-lg">🔒</span>
              <span>Özel çerçeveler Ultra Plus üyelerine açık.</span>
            </span>
            <Link
              href="/plus"
              className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-xs font-bold text-ink-900 shadow-glow-gold transition-transform hover:scale-105"
            >
              Yükselt
            </Link>
          </motion.div>
        )}

        {/* ── TEMA GRİDİ ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shown.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 260, damping: 22 }}
            >
              <ThemeCard
                theme={t}
                selected={current === t.id}
                disabled={!isThemeUnlocked(t, profile.points, allowed)}
                lockText={themeLockLabel(t)}
                avatarUrl={profile.avatar_url}
                username={profile.username}
                onPick={() => pick(t.id)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </Container>
  );
}
