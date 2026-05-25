/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sunucu-only paketler istemci bundle'ına dahil edilmez
  experimental: {
    serverComponentsExternalPackages: ["iyzipay", "resend"],
  },
};

export default nextConfig;
