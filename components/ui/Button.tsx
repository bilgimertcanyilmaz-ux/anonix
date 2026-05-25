import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

interface BaseProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const styles: Record<Variant, string> = {
  primary: "btn-primary",
  ghost: "btn-ghost",
};

/** İçeride veya dışarıda bağlantı olarak kullanılabilen buton. */
export function LinkButton({
  href,
  variant = "primary",
  children,
  className = "",
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={`${styles[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/** Standart tıklanabilir buton. */
export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
