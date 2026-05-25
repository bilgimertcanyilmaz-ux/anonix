/** Gölge overlay yazı konumları ve stilleri. */

export interface OverlayPosition {
  value: string;
  label: string;
  /** flex hizalama sınıfı (dikey konum). */
  className: string;
}

export const overlayPositions: OverlayPosition[] = [
  { value: "top", label: "Üst", className: "items-start" },
  { value: "center", label: "Orta", className: "items-center" },
  { value: "bottom", label: "Alt", className: "items-end" },
];

export interface OverlayStyle {
  value: string;
  label: string;
  className: string;
}

export const overlayStyles: OverlayStyle[] = [
  {
    value: "beyaz",
    label: "Beyaz Modern",
    className: "text-white font-extrabold drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]",
  },
  {
    value: "neon",
    label: "Neon",
    className:
      "font-extrabold text-cyan-300 [text-shadow:_0_0_8px_#22d3ee,_0_0_18px_#22d3ee,_0_0_30px_#0ea5e9]",
  },
  {
    value: "glitch",
    label: "Glitch",
    className:
      "font-extrabold text-white [text-shadow:_2px_0_#ff00c1,_-2px_0_#00fff9,_0_2px_#000]",
  },
  {
    value: "karanlik",
    label: "Karanlık",
    className: "font-bold text-white",
    // arka plan kutusu ayrıca uygulanır
  },
  {
    value: "minimal",
    label: "Minimal",
    className: "font-light tracking-wide text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]",
  },
];

const DEFAULT_STYLE = overlayStyles[0];

export function overlayStyleClass(value: string | null | undefined): string {
  if (!value) return DEFAULT_STYLE.className;
  return (overlayStyles.find((s) => s.value === value) ?? DEFAULT_STYLE).className;
}

/** "karanlik" stili metnin arkasına kutu ekler. */
export function overlayBoxClass(value: string | null | undefined): string {
  return value === "karanlik" ? "bg-black/55 rounded-xl px-3 py-2" : "";
}

export function overlayPositionClass(value: string | null | undefined): string {
  const found = overlayPositions.find((p) => p.value === value);
  return found ? found.className : "items-center";
}

/** Bir overlay_style değerini "stil:konum" olarak saklarız (örn. "neon:bottom"). */
export function packOverlay(style: string, position: string): string {
  return `${style}:${position}`;
}

export function unpackOverlay(packed: string | null | undefined): {
  style: string;
  position: string;
} {
  if (!packed) return { style: "beyaz", position: "center" };
  const [style, position] = packed.split(":");
  return { style: style || "beyaz", position: position || "center" };
}
