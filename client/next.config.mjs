/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Si tu utilises Docker "standalone" :
  // output: 'standalone',
  // Permet d'éviter des surprises côté images en PaaS
  images: { unoptimized: true },
};

export default nextConfig;