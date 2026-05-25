import { Container } from "@/components/layout/Container";

export default function Loading() {
  return (
    <Container>
      <div className="space-y-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-white/5" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="card h-32 animate-pulse" />
        ))}
      </div>
    </Container>
  );
}
