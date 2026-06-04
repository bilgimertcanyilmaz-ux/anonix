"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { canUseFeature } from "@/lib/subscription";
import { PREMIUM_THEMES, type PremiumTheme, isThemeUnlocked, themeLockLabel } from "@/lib/themes";
import { FramedAvatar } from "@/components/profile/FramedAvatar";

/** Tek bir tema kartı — premium PNG çerçeveyi (içinde avatarla) sergiler. */
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
      whileHover={disabled ? undefined : { y: -3, scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className={`group relative flex h-[180px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl p-3 transition-all disabled:opacity-50 ${
        selected ? "ring-2 ring-offset-2 ring-offset-ink-950" : ""
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(30,27,75,0.6) 0%, rgba(15,10,35,0.85) 100%)",
        border: `1.5px solid ${selected ? theme.accent : "rgba(255,255,255,0.08)"}`,
        boxShadow: selected
          ? `0 0 30px -4px ${theme.accent}, inset 0 1px 0 rgba(255,255,255,0.1)`
          : "0 4px 24px -8px rgba(0,0,0,0.4)",
      }}
    >
      {/* PNG taç çerçeve — sabit boyut, içinde avatar önizlemesiyle */}
      <div
        className="pointer-events-none relative z-10 transition-transform duration-300 group-hover:scale-105"
        style={{ filter: `drop-shadow(0 0 14px ${theme.accent}80)` }}
        aria-hidden
      >
        <FramedAvatar themeId={theme.id} size={124}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-accent-500 text-lg font-extrabold text-white">
              {username?.[0]?.toUpperCase() ?? "A"}
            </div>
          )}
        </FramedAvatar>
      </div>

      {/* Hover/selected glow blob */}
      <motion.span
        aria-hidden
        animate={selected ? { opacity: [0.4, 0.7, 0.4] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${theme.accent}33, transparent 70%)`,
          opacity: selected ? 0.6 : 0,
        }}
      />

      {/* Label */}
      <div className="relative z-10 w-full text-center">
        <p
          className="text-sm font-extrabold tracking-tight"
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

      {/* Locked overlay */}
      {disabled && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <span className="max-w-[90%] truncate rounded-full bg-black/70 px-3 py-1 text-center text-[11px] font-bold text-amber-300">
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

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user || !profile) {
    return (
      <Container>
        <div className="py-20 text-center text-sm text-slate-400">Yükleniyor...</div>
      </Container>
    );
  }

  const current = profile.premium_theme;

  async function pick(id: string | null) {
    const res = await updateProfile({ premium_theme: id });
    if (res.error) toastError("Tema kaydedilemedi.");
    else success(id ? "Premium tema uygulandı 🎨" : "Tema kaldırıldı");
  }

  return (
    <Container className="max-w-lg">
      <div className="py-4">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-1 text-2xl font-extrabold sm:text-3xl"
          style={{
            background: "linear-gradient(135deg, #fff 0%, #e9d5ff 50%, #c084fc 100%)",
            WebkitBackgroundClip: "text",
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
          Rütbe çerçeveleri rütbe atladıkça açılır; animasyonlu çerçeveler Ultra Plus ile.
        </motion.p>

        {!allowed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/[0.08] p-4 backdrop-blur-md"
            style={{ boxShadow: "0 0 24px -8px rgba(252,211,77,0.4)" }}
          >
            <span className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-lg">🔒</span>
              <span>Animasyonlu çerçeveler Ultra Plus ile; rütbe çerçeveleri rütbenle açılır.</span>
            </span>
            <Link
              href="/plus"
              className="shrink-0 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-4 py-2 text-xs font-bold text-ink-900 shadow-glow-gold transition-transform hover:scale-105"
            >
              Yükselt
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PREMIUM_THEMES.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 260, damping: 22 }}
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

        {current && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => pick(null)}
            className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-white"
          >
            <span>✕</span> Temayı kaldır
          </motion.button>
        )}
      </div>
    </Container>
  );
}
