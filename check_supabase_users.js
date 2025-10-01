#!/usr/bin/env node
/**
 * 🔍 Vérifier les utilisateurs dans Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
config({ path: join(__dirname, 'client', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes');
  console.log('URL:', supabaseUrl ? '✅' : '❌');
  console.log('Service Key:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUsers() {
  console.log('🔍 Vérification des utilisateurs Supabase...\n');

  try {
    // Liste tous les utilisateurs (nécessite service_role key)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Erreur:', error.message);
      return;
    }

    console.log(`📊 Total utilisateurs: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`👤 Utilisateur ${index + 1}:`);
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Email confirmé:', user.email_confirmed_at ? '✅ Oui' : '❌ Non');
      console.log('   Créé le:', new Date(user.created_at).toLocaleString('fr-FR'));
      console.log('   Dernière connexion:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('fr-FR') : 'Jamais');
      console.log('');
    });

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  }
}

checkUsers();