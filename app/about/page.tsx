import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "Anonix nedir, neden var ve nasıl çalışır? Anonim itiraf platformumuzun hikayesi.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalShell
      title="Hakkımızda"
      subtitle="Anonix; insanların yargılanma korkusu olmadan içini dökebileceği güvenli bir alan."
    >
      <h2>Anonix nedir?</h2>
      <p>
        Anonix, kim olduğunu söylemeden itiraf edebileceğin, başkalarının itiraflarını
        keşfedebileceğin ve tepki verebileceğin modern bir anonim sosyal platformdur.
        Amacımız; herkesin kendini özgürce ifade edebileceği, saygılı ve güvenli bir
        topluluk oluşturmaktır.
      </p>

      <h2>Neden var?</h2>
      <p>
        Bazı düşünceleri yüksek sesle söylemek zordur. Anonix, bu düşünceleri kimliğini
        açığa çıkarmadan paylaşmanı sağlar. İçini döktükçe rahatlar, benzer hisleri
        yaşayan insanlarla bağ kurarsın.
      </p>

      <h2>Nasıl çalışır?</h2>
      <ul>
        <li><strong>İtiraf paylaş:</strong> Anonim ya da kullanıcı adınla itiraflarını yaz.</li>
        <li><strong>Keşfet:</strong> Beğen, yorum yap, trend olan itirafları gör.</li>
        <li><strong>Gölge:</strong> Fotoğrafına overlay yazı ekleyip ayrı bir akışta paylaş.</li>
        <li><strong>Puan & rütbe:</strong> Etkileşimle puan kazan, rütbeni yükselt.</li>
        <li><strong>Plus:</strong> Özel mesajlaşma ve premium özelliklerin kilidini aç.</li>
      </ul>

      <h2>Güvenlik önceliğimiz</h2>
      <p>
        Anonim olmak, sorumsuz olmak demek değildir. Kişisel bilgi paylaşımı, tehdit,
        hakaret ve yasa dışı içerikler hem otomatik filtreler hem de moderasyon ekibimiz
        tarafından engellenir. Detaylar için Topluluk Kuralları ve Güvenlik Merkezi
        sayfalarımıza göz at.
      </p>
    </LegalShell>
  );
}
