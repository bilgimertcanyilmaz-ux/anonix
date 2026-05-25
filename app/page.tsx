import { Container } from "@/components/layout/Container";
import { Hero } from "@/components/home/Hero";
import { RankTeaser } from "@/components/home/RankTeaser";
import { PlusTeaser } from "@/components/home/PlusTeaser";
import { GolgeTeaser } from "@/components/home/GolgeTeaser";
import { SafetyTeaser } from "@/components/home/SafetyTeaser";
import { ConfessionCard } from "@/components/confession/ConfessionCard";
import { mockConfessions } from "@/lib/mockData";

export default function HomePage() {
  return (
    <Container>
      <Hero />

      {/* Örnek itiraf akışı */}
      <section className="space-y-4 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Öne çıkan itiraflar</h2>
          <span className="text-xs text-slate-500">canlı önizleme</span>
        </div>
        {mockConfessions.map((confession) => (
          <ConfessionCard key={confession.id} confession={confession} />
        ))}
      </section>

      <RankTeaser />
      <GolgeTeaser />
      <PlusTeaser />
      <SafetyTeaser />
    </Container>
  );
}
