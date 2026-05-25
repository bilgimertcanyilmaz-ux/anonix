import type { Confession, Gender } from "@/types";
import { HeartIcon, ChatIcon } from "@/components/ui/icons";

/** Cinsiyet bazlı profil çerçevesi rengi (ilerleyen aşamada genişleyecek). */
const genderRing: Record<Gender, string> = {
  male: "ring-accent-500/60",
  female: "ring-pink-500/60",
  other: "ring-brand-400/60",
};

const genderGradient: Record<Gender, string> = {
  male: "from-accent-500 to-accent-600",
  female: "from-pink-500 to-rose-600",
  other: "from-brand-500 to-brand-700",
};

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "B";
  return String(n);
}

export function ConfessionCard({ confession }: { confession: Confession }) {
  const { content, alias, gender, rank, likes, comments, createdAt, tags, isPlus } =
    confession;

  return (
    <article className="card card-hover animate-fade-up p-5">
      {/* Üst satır: avatar + rumuz + rütbe */}
      <div className="mb-3 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${genderGradient[gender]} text-sm font-bold text-white ring-2 ${genderRing[gender]}`}
        >
          {alias.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">
              @{alias}
            </span>
            {isPlus && (
              <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] font-bold text-brand-200">
                PLUS
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">
            {rank} · {createdAt}
          </span>
        </div>
      </div>

      {/* İçerik */}
      <p className="text-[15px] leading-relaxed text-slate-200">{content}</p>

      {/* Etiketler */}
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span key={tag} className="text-xs font-medium text-brand-300">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Alt satır: tepkiler */}
      <div className="mt-4 flex items-center gap-5 text-slate-400">
        <span className="inline-flex items-center gap-1.5 text-sm">
          <HeartIcon className="h-4 w-4" />
          {formatCount(likes)}
        </span>
        <span className="inline-flex items-center gap-1.5 text-sm">
          <ChatIcon className="h-4 w-4" />
          {formatCount(comments)}
        </span>
      </div>
    </article>
  );
}
