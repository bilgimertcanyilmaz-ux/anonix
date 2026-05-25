import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";
import { ContactForm } from "@/components/legal/ContactForm";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Anonix ekibiyle iletişime geç: destek, şikayet, hesap, Plus üyelik veya hukuki talepler.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalShell
      title="İletişim"
      subtitle="Bir sorun, öneri veya talebin mi var? Aşağıdaki formdan bize ulaş."
    >
      <ContactForm />
    </LegalShell>
  );
}
