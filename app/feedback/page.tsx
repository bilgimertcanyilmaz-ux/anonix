import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export const metadata: Metadata = {
  title: "Geri Bildirim",
  description: "Anonix hakkında görüşlerini, hataları ve fikirlerini bizimle paylaş.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <Container className="max-w-lg">
      <div className="py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-white">Geri Bildirim</h1>
          <p className="mt-1 text-sm text-slate-400">
            Anonix beta aşamasında. Görüşlerin platformu şekillendiriyor — bir hata, fikir
            veya öneri varsa bize yaz.
          </p>
        </div>
        <div className="card p-5">
          <FeedbackForm />
        </div>
      </div>
    </Container>
  );
}
