import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Topluluk Kuralları",
  description: "Anonix topluluk kuralları: güvenli, saygılı ve yasalara uygun bir platform için uymanız gerekenler.",
  alternates: { canonical: "/community-rules" },
};

export default function CommunityRulesPage() {
  return (
    <LegalShell
      title="Topluluk Kuralları"
      subtitle="Anonix'i herkes için güvenli tutmak ortak sorumluluğumuz. Aşağıdaki kurallar tüm kullanıcılar için bağlayıcıdır."
      updated="2026"
    >
      <h2>Kesinlikle yasaktır</h2>
      <ul>
        <li><strong>Kişisel bilgi paylaşımı:</strong> Kendine veya başkasına ait özel bilgileri paylaşmak yasaktır.</li>
        <li><strong>İletişim/kimlik bilgileri:</strong> Telefon numarası, açık adres, TC kimlik numarası gibi bilgileri paylaşmak yasaktır.</li>
        <li><strong>Tehdit, hakaret, taciz:</strong> Herhangi bir kullanıcıyı tehdit etmek, ona hakaret etmek veya taciz etmek yasaktır.</li>
        <li><strong>Çocuk güvenliği:</strong> Çocuk güvenliğini ihlal eden hiçbir içerik kabul edilmez; bu tür içerikler derhal kaldırılır ve gerektiğinde yetkililere bildirilir.</li>
        <li><strong>Yasa dışı eylem çağrısı:</strong> Suç teşkil eden eylemleri teşvik etmek veya organize etmek yasaktır.</li>
        <li><strong>İfşa ve hedef gösterme:</strong> Bir kişiyi ifşa etmek, hedef göstermek veya linç kampanyası başlatmak yasaktır.</li>
        <li><strong>Spam ve sahte yönlendirme:</strong> Spam içerik, aldatıcı bağlantı veya sahte yönlendirme yasaktır.</li>
      </ul>

      <h2>Anonimlik ve sorumluluk</h2>
      <p>
        Anonix'te anonim kalabilirsin; ancak paylaştığın içeriklerin{" "}
        <strong>hukuki sorumluluğu tamamen sana aittir.</strong> Anonim olmak, yasalar
        karşısındaki sorumluluğunu ortadan kaldırmaz. Gerekli durumlarda yetkili merciler
        tarafından talep edilen bilgiler ilgili mevzuat çerçevesinde paylaşılabilir.
      </p>

      <h2>Kurallara uymazsan</h2>
      <p>
        Kuralları ihlal eden içerikler kaldırılır. Tekrarlayan veya ağır ihlallerde
        hesabın kısıtlanabilir ya da kalıcı olarak banlanabilir. Banlanan hesaplar içerik
        paylaşamaz, yorum yapamaz, mesaj gönderemez ve beğeni veremez.
      </p>

      <p>
        Kurallara aykırı bir içerik gördüğünde, içeriğin altındaki <strong>Şikayet</strong>{" "}
        butonuyla bize bildir.
      </p>
    </LegalShell>
  );
}
