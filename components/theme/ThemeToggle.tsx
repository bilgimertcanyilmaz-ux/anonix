"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "@/components/ui/icons";
import { useAuth } from "@/components/auth/AuthProvider";

/** Koyu/aydınlık tema değiştirme butonu. Tercih localStorage'da (next-themes) saklanır. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, updateProfile } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Hydration uyumsuzluğunu önlemek için mount'tan önce nötr bir yer tutucu
  if (!mounted) {
    return <span className={`h-9 w-9 rounded-full bg-white/5 ${className}`} aria-hidden />;
  }

  const isDark = resolvedTheme !== "light";

  function toggle() {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    // Hesaba bağlı kalsın diye en iyi çaba ile DB'ye de yaz (zorunlu değil).
    if (user) void updateProfile({ theme_preference: next });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Aydınlık moda geç" : "Koyu moda geç"}
      title={isDark ? "Aydınlık mod" : "Koyu mod"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-200 transition-colors hover:bg-white/10 hover:text-white ${className}`}
    >
      {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
