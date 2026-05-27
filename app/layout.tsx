import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { UnreadProvider } from "@/components/messages/UnreadProvider";
import { NotifProvider } from "@/components/notifications/NotifProvider";
import { StreakTracker } from "@/components/streaks/StreakTracker";
import { SoundManager } from "@/components/sound/SoundManager";
import { SessionTracker } from "@/components/analytics/SessionTracker";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { PwaManager } from "@/components/pwa/PwaManager";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { SatisfactionPopup } from "@/components/feedback/SatisfactionPopup";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.slogan}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: siteConfig.name,
  },
  other: { "mobile-web-app-capable": "yes" },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#06060b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <UnreadProvider>
                <NotifProvider>
                  <StreakTracker />
                  <SoundManager />
                  <SessionTracker />
                  <Navbar />
                  <main className="pt-6">{children}</main>
                  {/* Footer global değil — yalnızca /profile sayfasında gösterilir. */}
                  {/* Alt boşluk: mobilde bottom-nav'ın içeriği örtmemesi için */}
                  <div className="h-20 md:hidden" />
                  <BottomNav />
                  <PwaManager />
                  <FeedbackWidget />
                  <SatisfactionPopup />
                </NotifProvider>
              </UnreadProvider>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
