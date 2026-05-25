import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description: "Anonix kullanım şartları: üyelik, içerik sorumluluğu, Plus üyelik ve hesap kısıtlamaları.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Kullanım Şartları"
      subtitle="Anonix'i kullanarak aşağıdaki şartları kabul etmiş olursun."
      updated="2026"
    >
      <h2>1. Kullanım şartları</h2>
      <p>
        Anonix'i kullanarak bu şartları ve Topluluk Kuralları'nı okuduğunu, anladığını ve
        kabul ettiğini beyan edersin. Platformu yalnızca yasalara uygun amaçlarla
        kullanabilirsin.
      </p>

      <h2>2. Üyelik şartları</h2>
      <ul>
        <li>Hesap oluşturmak için geçerli bir e-posta adresi gerekir.</li>
        <li>Hesabının güvenliğinden ve şifrenden sen sorumlusun.</li>
        <li>13 yaşından küçükler platformu kullanamaz.</li>
      </ul>

      <h2>3. Plus üyelik</h2>
      <ul>
        <li>Plus üyelik, özel mesajlaşma ve premium özellikler sağlar.</li>
        <li>Geliştirme sürümünde Plus ücretsiz olarak etkinleştirilebilir; ileride ücretli olabilir.</li>
        <li>Plus özellikleri önceden haber verilerek değiştirilebilir.</li>
      </ul>

      <h2>4. İçerik sorumluluğu</h2>
      <p>
        Paylaştığın tüm içeriklerden <strong>tek başına sen sorumlusun.</strong> Anonim
        paylaşım yapsan dahi içeriğin hukuki sorumluluğu sana aittir. Anonix, kullanıcılar
        tarafından üretilen içeriklerden sorumlu tutulamaz.
      </p>

      <h2>5. Yasaklı kullanım</h2>
      <ul>
        <li>Kişisel bilgi, telefon, adres, kimlik numarası paylaşmak.</li>
        <li>Tehdit, hakaret, taciz, ifşa ve hedef gösterme.</li>
        <li>Yasa dışı içerik, çocuk güvenliğini ihlal, spam ve dolandırıcılık.</li>
        <li>Platformun teknik altyapısına zarar verme veya kötüye kullanma.</li>
      </ul>

      <h2>6. Hesap kısıtlama ve ban</h2>
      <p>
        Kuralları ihlal eden hesaplar uyarılmadan kısıtlanabilir veya kalıcı olarak
        banlanabilir. Banlanan kullanıcılar içerik üretemez. Ban kararına itirazını
        İletişim sayfasından iletebilirsin.
      </p>

      <h2>7. Sorumluluk reddi</h2>
      <p>
        Anonix “olduğu gibi” sunulur. Hizmetin kesintisiz veya hatasız olacağını garanti
        etmeyiz. Platformun kullanımından doğabilecek dolaylı zararlardan sorumlu
        değiliz.
      </p>

      <p>
        <strong>Not:</strong> Bu metin bilgilendirme amaçlıdır ve hukuki danışmanlık
        yerine geçmez; yayına almadan önce bir hukuk uzmanına danışman önerilir.
      </p>
    </LegalShell>
  );
}
