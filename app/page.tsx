"use client";

import { Container } from "@/components/layout/Container";
import { GuestHome } from "@/components/home/GuestHome";
import { AuthHome } from "@/components/home/AuthHome";
import { useAuth } from "@/components/auth/AuthProvider";

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <Container>
      {loading ? (
        <HomeSkeleton />
      ) : user ? (
        <AuthHome />
      ) : (
        <GuestHome />
      )}
    </Container>
  );
}

/** Oturum durumu çözülürken gösterilen yükleme iskeleti. */
function HomeSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <div className="h-32 animate-pulse rounded-3xl bg-white/5" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
