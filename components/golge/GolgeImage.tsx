import {
  unpackOverlay,
  overlayStyleClass,
  overlayPositionClass,
  overlayBoxClass,
} from "@/lib/golge";

interface GolgeImageProps {
  imageUrl: string;
  overlayText?: string | null;
  /** "stil:konum" biçiminde paketlenmiş overlay ayarı. */
  overlay?: string | null;
  /** Tam ekran/detay için object-contain; feed için cover. */
  contain?: boolean;
  rounded?: boolean;
  className?: string;
  textSize?: string;
}

/** Görseli, üzerine şık konumlanmış overlay yazıyla birlikte gösterir. */
export function GolgeImage({
  imageUrl,
  overlayText,
  overlay,
  contain = false,
  rounded = true,
  className = "",
  textSize = "text-xl sm:text-2xl",
}: GolgeImageProps) {
  const { style, position } = unpackOverlay(overlay);

  return (
    <div className={`relative overflow-hidden ${rounded ? "rounded-2xl" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={overlayText || "Gölge paylaşımı"}
        className={`w-full ${contain ? "max-h-[80vh] object-contain" : "h-auto object-cover"}`}
      />

      {overlayText && (
        <div
          className={`pointer-events-none absolute inset-0 flex justify-center p-4 ${overlayPositionClass(position)}`}
        >
          <p
            className={`gi-overlay max-w-full break-words text-center leading-snug ${textSize} ${overlayStyleClass(style)} ${overlayBoxClass(style)} line-clamp-6`}
          >
            {overlayText}
          </p>
        </div>
      )}
    </div>
  );
}
