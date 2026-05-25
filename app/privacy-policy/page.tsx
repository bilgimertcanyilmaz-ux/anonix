import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: "Anonix hangi verileri toplar, anonimlik nasıl çalışır ve verileriniz nasıl korunur?",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalShell
      title="Gizlilik Politikası"
      subtitle="Gizliliğine değer veriyoruz. Bu sayfa hangi verileri topladığımızı ve nasıl koruduğumuzu açıklar."
      updated="2026"
    >
      <h2>Hangi veriler toplanır?</h2>
      <ul>
        <li><strong>Hesap bilgileri:</strong> Kullanıcı adı, e-posta adresi ve şifre (şifreler şifrelenmiş olarak saklanır).</li>
        <li><strong>Profil bilgileri:</strong> Cinsiyet tercihi, anonimlik durumu, puan ve rütbe.</li>
        <li><strong>İçerik:</strong> Paylaştığın itiraflar, Gölge gönderileri, yorumlar ve beğeniler.</li>
        <li><strong>Mesajlaşma:</strong> Plus üyeler arasındaki özel mesajlar.</li>
        <li><strong>Teknik veriler:</strong> Oturum bilgileri ve temel kullanım verileri.</li>
      </ul>

      <h2>Anonimlik nasıl çalışır?</h2>
      <p>
        İçeriklerini anonim paylaştığında, kullanıcı adın diğer kullanıcılara{" "}
        <strong>“Anonim Kullanıcı”</strong> olarak görünür. Kimliğin platform içinde
        görünmez. Ancak hesabının e-postası, hesap yönetimi için sistemde tutulur.
      </p>

      <h2>E-posta ve profil verileri</h2>
      <p>
        E-posta adresin yalnızca kimlik doğrulama, hesap kurtarma ve önemli bildirimler
        için kullanılır. Pazarlama amacıyla üçüncü taraflarla paylaşılmaz.
      </p>

      <h2>Mesajlaşma verileri</h2>
      <p>
        Özel mesajlar yalnızca konuşmanın taraflarına gösterilir. Veritabanı erişim
        kuralları (RLS) sayesinde başka kullanıcılar mesajlarına erişemez.
      </p>

      <h2>Çerezler</h2>
      <p>
        Oturumunu açık tutmak için gerekli teknik çerezleri/oturum verilerini kullanırız.
        Üçüncü taraf reklam takip çerezleri kullanmıyoruz.
      </p>

      <h2>Altyapı</h2>
      <p>
        Anonix, kimlik doğrulama, veritabanı ve dosya depolama için{" "}
        <strong>Supabase</strong> altyapısını kullanır. Veriler erişim kuralları ile
        korunur.
      </p>

      <h2>Veri silme talebi</h2>
      <p>
        Hesabının ve verilerinin silinmesini istersen İletişim sayfasından “Hesap”
        konusuyla bize ulaşabilirsin. Talebin yasal saklama yükümlülükleri çerçevesinde
        işleme alınır.
      </p>

      <h2>Güvenlik önlemleri</h2>
      <p>
        Şifreler güvenli biçimde saklanır, veritabanı erişimi satır bazlı güvenlik
        politikalarıyla sınırlandırılır ve içerikler otomatik moderasyondan geçer.
      </p>

      <h2>İletişim</h2>
      <p>
        Gizlilikle ilgili sorularını İletişim sayfasından bize iletebilirsin.
      </p>

      <p>
        <strong>Not:</strong> Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık
        yerine geçmez; yayına almadan önce bir hukuk uzmanına danışman önerilir.
      </p>
    </LegalShell>
  );
}
