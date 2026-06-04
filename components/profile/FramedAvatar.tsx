import type { ReactNode } from "react";
import { getPremiumTheme } from "@/lib/themes";

/**
 * Premium rütbe çerçeveli avatar.
 *
 * `themeId` bir premium temaya denk geliyorsa, avatarı çerçeve PNG'sinin
 * halka boşluğuna (lib/themes.ts içindeki otomatik ölçülmüş `hole` geometrisi)
 * yerleştirir ve taç/çelenk çerçeveyi avatarın üzerine bindirir.
 *
 * Tema yoksa, sadece dairesel avatarı döndürür — çağıran taraf kendi
 * cinsiyet/neon halkasını kullanmaya devam edebilir.
 */
export function FramedAvatar({
  themeId,
  size = 112,
  className = "",
  children,
}: {
  /** profile.premium_theme değeri. */
  themeId: string | null | undefined;
  /** Çerçeve kutusunun piksel boyutu (kare). */
  size?: number;
  className?: string;
  /** Avatar görseli (img/initials) — dairesel kırpılır. */
  children: ReactNode;
}) {
  const theme = getPremiumTheme(themeId);

  // Tema yoksa: düz dairesel avatar.
  if (!theme) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        {children}
      </div>
    );
  }

  const { cx, cy, r } = theme.hole;
  // Avatarı halkanın biraz altına sokarak (1.06×) dikiş çizgisini gizle.
  const d = r * 2 * 1.06;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Avatar — halka boşluğuna konumlanır, çerçevenin ALTINDA kalır */}
      <div
        className="absolute overflow-hidden rounded-full bg-ink-950"
        style={{
          left: `${(cx - d / 2) * 100}%`,
          top: `${(cy - d / 2) * 100}%`,
          width: `${d * 100}%`,
          height: `${d * 100}%`,
        }}
      >
        {children}
      </div>

      {/* Taç/çelenk çerçeve PNG — avatarın ÜSTÜNE biner */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={theme.frameSrc}
        alt=""
        aria-hidden
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        style={{ filter: `drop-shadow(0 0 10px ${theme.accent}66)` }}
      />
    </div>
  );
}
