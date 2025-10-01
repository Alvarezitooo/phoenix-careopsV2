/** @type {import('next').NextConfig} */
const nextConfig = {
  // 🔥 JAMstack sur Railway - Configuration Hybride
  reactStrictMode: true,

  // Désactiver ESLint strict pour le build (erreurs non-bloquantes)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optimisation Railway CDN
  images: {
    unoptimized: true,
  },

  // Build ID pour cache busting
  generateBuildId: async () => {
    return 'phoenix-care-' + Date.now()
  },

  // Optimisations performance
  swcMinify: true,
  compress: true,

  // Headers sécurisés
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // Redirections pour SPA routing
  async rewrites() {
    // TEMPORAIRE: Désactiver proxy pour utiliser routes API Next.js locales
    // qui appellent directement le RAG server sur port 8000
    return [];

    // En développement, proxy vers le serveur Express local
    // En production, l'Express server gère déjà les routes API
    /*
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: `http://localhost:${process.env.SERVER_PORT || 8080}/api/:path*`,
        },
      ];
    }
    return [];
    */
  },
};

export default nextConfig;