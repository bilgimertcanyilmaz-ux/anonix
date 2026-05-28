"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type Variant = "neon" | "gold" | "muted" | "electric" | "pink";
type Size = "xs" | "sm" | "md";

interface PremiumBadgeProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

const sizeClass: Record<Size, string> = {
  xs: "px-2 py-0.5 text-[10px]",
  sm: "px-2.5 py-1 text-xs",
  md: "px-3 py-1.5 text-sm",
};

function variantClass(variant: Variant): string {
  switch (variant) {
    case "neon":
      return "border border-brand-400/40 bg-brand-500/15 text-brand-200";
    case "gold":
      return "border border-gold-400/55 bg-gradient-to-r from-gold-500/20 to-brand-500/20 text-gold-200";
    case "muted":
      return "border border-white/10 bg-white/[0.05] text-slate-300";
    case "electric":
      return "border border-accent-400/40 bg-accent-500/15 text-accent-400";
    case "pink":
      return "border border-pink-400/40 bg-pink-500/15 text-pink-300";
    default:
      return "border border-brand-400/40 bg-brand-500/15 text-brand-200";
  }
}

/**
 * Premium badge — neon glow, gold for Ultra Plus, muted for tags.
 */
export function PremiumBadge({
  variant = "neon",
  size = "sm",
  icon,
  children,
  className = "",
  glow = false,
}: PremiumBadgeProps) {
  const glowClass = glow
    ? variant === "gold"
      ? "shadow-glow-gold"
      : "shadow-glow-sm"
    : "";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold backdrop-blur ${variantClass(
        variant
      )} ${sizeClass[size]} ${glowClass} ${className}`}
    >
      {icon && <span className="-ml-0.5">{icon}</span>}
      {children}
    </span>
  );
}

/**
 * Animated badge — fade-in + scale when mounted.
 */
export function MotionPremiumBadge(props: PremiumBadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 360, damping: 22 }}
      className="inline-block"
    >
      <PremiumBadge {...props} />
    </motion.span>
  );
}
