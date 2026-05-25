/** Site geneli yapılandırma (SEO + metinler). */

export const siteConfig = {
  name: "Anonix",
  slogan: "Anonim kal, içini dök.",
  description:
    "Anonix; kim olduğunu söylemeden itiraf edebileceğin, keşfedebileceğin ve tepki alabileceğin modern, güvenli ve anonim sosyal platform.",
  // Yayına alınca NEXT_PUBLIC_SITE_URL ile gerçek alan adını ayarlayın.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://anonix.app",
  keywords: [
    "anonim",
    "itiraf",
    "anonim itiraf",
    "sosyal platform",
    "gizli",
    "gölge",
    "anonix",
    "içini dök",
  ],
  // Footer + navigasyon için yasal/kurumsal bağlantılar
  footerLinks: [
    { href: "/about", label: "Hakkımızda" },
    { href: "/community-rules", label: "Topluluk Kuralları" },
    { href: "/privacy-policy", label: "Gizlilik Politikası" },
    { href: "/terms", label: "Kullanım Şartları" },
    { href: "/safety", label: "Güvenlik" },
    { href: "/contact", label: "İletişim" },
    { href: "/leaderboard", label: "Liderlik" },
    { href: "/invite", label: "Davet Et" },
    { href: "/plus", label: "Plus" },
  ],
};
