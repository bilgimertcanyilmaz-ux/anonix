import type { Gender } from "@/types";
import { getGenderLabel, getGenderBadgeClass } from "@/lib/gender";

/** Cinsiyet rozeti — tüm yüzeylerde tutarlı görünüm (anonimlikten bağımsız). */
export function GenderBadge({
  gender,
  className = "",
}: {
  gender: Gender | string | null | undefined;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getGenderBadgeClass(gender)} ${className}`}
    >
      {getGenderLabel(gender)}
    </span>
  );
}
