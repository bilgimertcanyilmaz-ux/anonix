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
 *
 * Boyutlandırma:
 * - `size` (px): sabit kare kutu (profil başlıkları gibi belirli alanlar için).
 * - `fill`: kapsayıcıya sığan en büyük KARE (kart önizlemeleri için) — çerçeve
 *   asla kırpılmaz, dar kartlarda bile taç/çelenk tam görünür.
 */
export function FramedAvatar({
  themeId,
  size = 112,
  fill = false,
  className = "",
  children,
}: {
  /** profile.premium_theme değeri. */
  themeId: string | null | undefined;
  /** Çerçeve kutusunun piksel boyutu (kare). `fill` true ise yok sayılır. */
  size?: number;
  /** true ise kapsayıcıyı dolduran kare olur (sabit px yerine). */
  fill?: boolean;
  className?: string;
  /** Avatar görseli (img/initials) — dairesel kırpılır. */
  children: ReactNode;
}) {
  const theme = getPremiumTheme(themeId);

  // Kare kök kutu: fill → kapsayıcıya sığan en büyük kare; değilse sabit px.
  const rootCls = fill ? "aspect-square w-full max-h-full" : "shrink-0";
  const rootStyle = fill ? undefined : { width: size, height: size };

  // Tema yoksa: düz dairesel avatar.
  if (!theme) {
    return (
      <div
        className={`relative overflow-hidden rounded-full ${rootCls} ${className}`}
        style={rootStyle}
      >
        {children}
      </div>
    );
  }

  const { cx, cy, r } = theme.hole;
  // Avatarı halkanın biraz altına sokarak (1.06×) dikiş çizgisini gizle.
  const d = r * 2 * 1.06;

  return (
    <div className={`relative ${rootCls} ${className}`} style={rootStyle}>
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
