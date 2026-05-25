import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Güvenlik Merkezi",
  description: "Anonix'te güvenli paylaşım yapmanın yolları, şikayet mekanizması ve acil durum destek kanalları.",
  alternates: { canonical: "/safety" },
};

export default function SafetyPage() {
  return (
    <LegalShell
      title="Güvenlik Merkezi"
      subtitle="Kendini ve başkalarını güvende tutmak için bilmen gerekenler."
    >
      <h2>Güvenli paylaşım yap</h2>
      <ul>
        <li>Adını, telefon numaranı, adresini veya kimlik bilgilerini <strong>asla</strong> paylaşma.</li>
        <li>Başkalarının kişisel bilgilerini paylaşma; bu hem yasak hem de tehlikelidir.</li>
        <li>Tanımadığın kişilerle özel mesajda hassas bilgi paylaşma.</li>
        <li>Şüpheli bağlantılara tıklama; spam ve dolandırıcılığa karşı dikkatli ol.</li>
      </ul>

      <h2>Rahatsız edici içerik gördüğünde</h2>
      <p>
        Her itiraf, yorum ve Gölge gönderisinin altında <strong>Şikayet</strong> butonu
        bulunur. Hakaret, tehdit, ifşa veya yasa dışı içerik gördüğünde bu butonla bildir.
        Şikayetler gizli tutulur ve ekibimiz tarafından incelenir.
      </p>

      <h2>Kendine zarar verme riski</h2>
      <p>
        Eğer sen veya tanıdığın biri kendine zarar verme riski taşıyorsa, lütfen yalnız
        olmadığını bil. Profesyonel destek almak güçlü bir adımdır. Bu tür içerikleri
        gördüğünde şikayet et; biz de destek kaynaklarına yönlendirmeye çalışırız.
      </p>

      <h2>Acil durumlar</h2>
      <p>
        Hayati tehlike içeren bir durumda zaman kaybetmeden resmi yardım kanallarına
        başvur:
      </p>
      <ul>
        <li><strong>Acil çağrı: 112</strong> (Türkiye geneli acil durumlar)</li>
        <li><strong>Polis İmdat: 155</strong></li>
        <li>Bulunduğun ülkedeki yerel acil yardım hattını ara.</li>
      </ul>
      <p>
        Anonix bir destek veya kriz hattı değildir; acil durumlarda mutlaka resmi
        kurumlara ulaş.
      </p>
    </LegalShell>
  );
}
