import Link from "next/link";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

/** Tek tip boş-durum kartı: ikon + başlık + açıklama + isteğe bağlı CTA. */
export function EmptyState({
  icon = "🌙",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center gap-2 p-8 py-12 text-center">
      <span className="text-4xl" aria-hidden>
        {icon}
      </span>
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {description && (
        <p className="max-w-xs text-xs leading-relaxed text-slate-400">{description}</p>
      )}
      {actionLabel &&
        (actionHref ? (
          <Link href={actionHref} className="btn-premium mt-3 px-5 py-2 text-xs">
            {actionLabel}
          </Link>
        ) : onAction ? (
          <button type="button" onClick={onAction} className="btn-premium mt-3 px-5 py-2 text-xs">
            {actionLabel}
          </button>
        ) : null)}
    </div>
  );
}
