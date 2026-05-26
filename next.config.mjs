/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

// İçerik Güvenliği Politikası — Supabase (REST+realtime), iyzico ve
// görsellerle uyumlu; uygulamayı bozmayacak şekilde dengeli.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.supabase.com https://*.iyzipay.com https://*.iyzico.com",
  "frame-src 'self' https://*.iyzipay.com https://*.iyzico.com",
  "form-action 'self' https://*.iyzipay.com https://*.iyzico.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  // Sunucu-only paketler istemci bundle'ına dahil edilmez
  experimental: {
    serverComponentsExternalPackages: ["iyzipay", "resend"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
