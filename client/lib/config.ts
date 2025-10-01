/**
 * 🔧 Configuration client-side pour PhoenixCare
 *
 * Utilise les variables d'environnement Next.js (NEXT_PUBLIC_*)
 * Validation des variables obligatoires au démarrage
 */

interface ClientConfig {
  apiUrl: string;
  supabase: {
    url: string;
    anonKey: string;
  };
  isDevelopment: boolean;
  isProduction: boolean;
}

// Validation des variables d'environnement requises
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`❌ Variable d'environnement manquante: ${envVar}`);
  }
}

// Configuration validée
export const config: ClientConfig = {
  // API Backend (BFF TypeScript)
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api',

  // Supabase
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },

  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Helper pour construire des URLs d'API
export const buildApiUrl = (path: string): string => {
  // Normaliser le path (enlever / du début)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Si apiUrl est relatif (commence par /), retourner directement
  if (config.apiUrl.startsWith('/')) {
    return `${config.apiUrl}${normalizedPath}`;
  }

  // Sinon construire l'URL complète
  return `${config.apiUrl}${normalizedPath}`;
};

// Vérification au runtime (dev only)
if (config.isDevelopment) {
  console.log('✅ Configuration client chargée:', {
    apiUrl: config.apiUrl,
    supabaseUrl: config.supabase.url,
    environment: process.env.NODE_ENV,
  });
}
