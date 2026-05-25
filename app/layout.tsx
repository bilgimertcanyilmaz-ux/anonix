import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anonix — Anonim kal, içini dök.",
  description:
    "Kim olduğunu söylemeden itiraf et, keşfet, tepki al. Anonix; itiraf, puan ve rütbe odaklı modern anonim sosyal platform.",
  keywords: ["anonim", "itiraf", "sosyal", "anonix"],
};

export const viewport: Viewport = {
  themeColor: "#06060b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            {/* Alt boşluk: mobilde bottom-nav'ın içeriği örtmemesi için */}
            <main className="pb-24 pt-6 md:pb-12">{children}</main>
            <BottomNav />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
