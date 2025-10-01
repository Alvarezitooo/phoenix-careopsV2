import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_KEY;

if (!env.SUPABASE_SERVICE_ROLE_KEY && env.NODE_ENV === 'production') {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY non défini : utilisation de la clé publique. Vérifiez la configuration avant la prod.');
}

export const supabase = createClient(env.SUPABASE_URL, serviceKey, {
  auth: {
    persistSession: false,
  },
});
