"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type Variant = "premium" | "glow" | "ghost" | "gold" | "outline" | "subtle";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
  children?: ReactNode;
}

const sizeClass: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

function variantClass(variant: Variant): string {
  switch (variant) {
    case "premium":
      return "btn-premium";
    case "glow":
      return "btn-glow";
    case "ghost":
      return "btn-ghost";
    case "gold":
      return "inline-flex items-center justify-center gap-2 rounded-full bg-ultra-gold px-6 py-2.5 text-sm font-bold text-ink-950 shadow-glow-gold transition-transform duration-200 active:scale-95";
    case "outline":
      return "inline-flex items-center justify-center gap-2 rounded-full border-2 border-brand-500/50 bg-transparent px-6 py-2.5 text-sm font-semibold text-brand-200 transition-all duration-300 hover:border-brand-400 hover:bg-brand-500/10 hover:text-white";
    case "subtle":
      return "inline-flex items-center justify-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-5 py-2 text-sm font-medium text-slate-200 transition-colors duration-200 hover:bg-white/[0.08] hover:text-white backdrop-blur";
    default:
      return "btn-premium";
  }
}

type ButtonElProps = BaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;

/**
 * Premium button — UI redesign.
 * Variants: premium (gradient), glow (neon pulse), gold (Ultra Plus), ghost, outline, subtle.
 */
export const PremiumButton = forwardRef<HTMLButtonElement, ButtonElProps>(function PremiumButton(
  {
    variant = "premium",
    size = "md",
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    loading = false,
    disabled,
    className = "",
    children,
    ...rest
  },
  ref
) {
  const base = variantClass(variant);
  // size override (lg/sm) for variants that allow it
  const customSize =
    variant === "ghost" || variant === "subtle" || variant === "outline" || variant === "gold"
      ? sizeClass[size]
      : "";
  const widthClass = fullWidth ? "w-full" : "";
  const classes = [base, customSize, widthClass, className].filter(Boolean).join(" ");

  // Disabled/Loading state — opacity + cursor
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={`${classes} ${isDisabled ? "opacity-60 pointer-events-none" : ""}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        leadingIcon
      )}
      <span className="inline-flex items-center whitespace-nowrap">{children}</span>
      {!loading && trailingIcon}
    </button>
  );
});

/**
 * Motion-enabled button — tap scale + hover lift.
 */
type MotionButtonProps = BaseProps &
  Omit<HTMLMotionProps<"button">, keyof BaseProps>;

export function MotionPremiumButton({
  variant = "premium",
  size = "md",
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  loading = false,
  disabled,
  className = "",
  children,
  ...rest
}: MotionButtonProps) {
  const base = variantClass(variant);
  const customSize =
    variant === "ghost" || variant === "subtle" || variant === "outline" || variant === "gold"
      ? sizeClass[size]
      : "";
  const widthClass = fullWidth ? "w-full" : "";
  const classes = [base, customSize, widthClass, className].filter(Boolean).join(" ");
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? undefined : { y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`${classes} ${isDisabled ? "opacity-60 pointer-events-none" : ""}`}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        leadingIcon
      )}
      <span className="inline-flex items-center whitespace-nowrap">{children}</span>
      {!loading && trailingIcon}
    </motion.button>
  );
}
