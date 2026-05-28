"use client";

import { motion } from "framer-motion";

interface AppSwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
}

/**
 * Premium iOS-style switch — neon glow when on.
 */
export function AppSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  ariaLabel,
}: AppSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label || "toggle"}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ${
        checked
          ? "bg-gradient-to-r from-brand-500 to-brand-400 shadow-glow-sm"
          : "bg-white/10"
      } ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      <motion.span
        animate={{ x: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-md ${
          checked ? "shadow-brand-300/40" : ""
        }`}
      />
    </button>
  );
}
