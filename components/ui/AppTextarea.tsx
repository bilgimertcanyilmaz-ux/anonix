"use client";

import type { TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";

interface AppTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  charCount?: number;
  maxChars?: number;
}

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(
  ({ label, hint, error, charCount, maxChars, className = "", ...rest }, ref) => {
    const nearLimit = maxChars && charCount !== undefined && charCount > maxChars * 0.85;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={[
            "w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500",
            "backdrop-blur-sm transition-all duration-200",
            "focus:border-brand-500/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-brand-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20" : "",
            className,
          ].filter(Boolean).join(" ")}
          {...rest}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
          </div>
          {maxChars !== undefined && charCount !== undefined && (
            <p className={`shrink-0 text-xs ${nearLimit ? "text-amber-400" : "text-slate-600"}`}>
              {charCount}/{maxChars}
            </p>
          )}
        </div>
      </div>
    );
  }
);
AppTextarea.displayName = "AppTextarea";
