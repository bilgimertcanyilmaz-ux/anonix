"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type Variant = "default" | "gold" | "subtle" | "raised";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: Variant;
  hover?: boolean;
  glow?: boolean;
  animateIn?: boolean;
  children?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  default: "glass-card",
  gold: "glass-card-gold",
  subtle: "rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-md",
  raised: "glass-card shadow-premium-lg",
};

/**
 * Premium glass card — UI redesign Faz 1.
 * Default: glass-card (purple glow border, gradient sheen)
 * Variants: gold (Ultra Plus), subtle (compact), raised (large CTA)
 */
export function GlassCard({
  variant = "default",
  hover = false,
  glow = false,
  animateIn = false,
  className = "",
  children,
  ...rest
}: GlassCardProps) {
  const classes = [
    variantClass[variant],
    hover ? "glass-card-hover cursor-pointer" : "",
    glow ? "animate-pulse-glow" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const initial = animateIn ? { opacity: 0, y: 12 } : undefined;
  const animate = animateIn ? { opacity: 1, y: 0 } : undefined;
  const transition = animateIn
    ? { type: "spring" as const, stiffness: 220, damping: 24 }
    : undefined;

  return (
    <motion.div
      className={classes}
      initial={initial}
      animate={animate}
      transition={transition}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Statik (non-motion) glass card — render maliyeti düşük list itemları için.
 */
export function StaticGlassCard({
  variant = "default",
  hover = false,
  className = "",
  children,
  ...rest
}: { variant?: Variant; hover?: boolean } & HTMLAttributes<HTMLDivElement>) {
  const classes = [
    variantClass[variant],
    hover ? "glass-card-hover" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
