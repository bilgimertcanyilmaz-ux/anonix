"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

interface AppInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  ({ label, hint, error, icon, suffix, className = "", ...rest }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-xs font-semibold text-slate-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="pointer-events-none absolute left-3.5 text-slate-400">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={[
              "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-500",
              "backdrop-blur-sm transition-all duration-200",
              "focus:border-brand-500/60 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-brand-500/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20" : "",
              icon ? "pl-10" : "",
              suffix ? "pr-10" : "",
              className,
            ].filter(Boolean).join(" ")}
            {...rest}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-3.5 text-slate-400">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      </div>
    );
  }
);
AppInput.displayName = "AppInput";
