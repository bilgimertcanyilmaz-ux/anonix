import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/** Sayfa içeriğini ortalayan, mobil öncelikli genişlik sınırlayıcı. */
export function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-full max-w-2xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}
