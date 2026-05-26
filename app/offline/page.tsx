import { Container } from "@/components/layout/Container";

export const metadata = { title: "Çevrimdışı" };

export default function OfflinePage() {
  return (
    <Container>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
        <span className="text-5xl">📡</span>
        <h1 className="text-2xl font-extrabold text-white">Bağlantı yok</h1>
        <p className="max-w-xs text-sm text-slate-400">
          Lütfen internet bağlantını kontrol et. Bağlantı geri geldiğinde Anonix otomatik olarak
          yüklenecek.
        </p>
      </div>
    </Container>
  );
}
