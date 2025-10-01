#!/usr/bin/env node
/**
 * 🔍 SCRIPT DE DIAGNOSTIC SUPABASE
 * Test la connexion et les RLS policies
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
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🚀 Démarrage du diagnostic Supabase...\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('📡 Test 1: Connexion à Supabase');
  console.log('URL:', supabaseUrl);
  console.log('');

  // Test auth
  console.log('🔐 Test 2: Vérification de l\'authentification');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('❌ Erreur session:', sessionError.message);
  } else if (!session) {
    console.log('⚠️  Aucune session active - Tentative de création d\'un compte de test...\n');

    // Créer un compte de test
    const testEmail = 'rubiamatthieu@gmail.com';
    const testPassword = 'PhoenixTest2024!';

    console.log('📝 Création compte test:', testEmail);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test Utilisateur Debug'
        }
      }
    });

    if (signUpError) {
      console.error('❌ Erreur signup:', signUpError.message);

      // Essayer de se connecter à la place
      console.log('\n🔄 Tentative de connexion avec compte existant...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (signInError) {
        console.error('❌ Erreur signin:', signInError.message);
        return;
      }

      console.log('✅ Connexion réussie!');
      console.log('User ID:', signInData.user?.id);
    } else {
      console.log('✅ Compte créé!');
      console.log('User ID:', signUpData.user?.id);
    }
  } else {
    console.log('✅ Session active');
    console.log('User ID:', session.user.id);
  }

  // Récupérer la session mise à jour
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (!currentSession) {
    console.log('\n❌ Impossible de continuer sans session');
    return;
  }

  const userId = currentSession.user.id;
  console.log('\n📊 Test 3: Vérification des tables et RLS');

  // Test family_profiles
  console.log('\n--- Table: family_profiles ---');
  const { data: profiles, error: profilesError } = await supabase
    .from('family_profiles')
    .select('*')
    .eq('user_id', userId);

  if (profilesError) {
    console.error('❌ Erreur:', profilesError.message);
    console.log('Code:', profilesError.code);
    console.log('Details:', profilesError.details);
  } else {
    console.log('✅ Accès OK -', profiles.length, 'profil(s) trouvé(s)');
    if (profiles.length > 0) {
      console.log('Profil:', profiles[0]);
    }
  }

  // Test user_aides
  console.log('\n--- Table: user_aides ---');
  const { data: aides, error: aidesError } = await supabase
    .from('user_aides')
    .select('*')
    .eq('user_id', userId);

  if (aidesError) {
    console.error('❌ Erreur:', aidesError.message);
  } else {
    console.log('✅ Accès OK -', aides.length, 'aide(s) trouvée(s)');
  }

  // Test user_documents
  console.log('\n--- Table: user_documents ---');
  const { data: documents, error: documentsError } = await supabase
    .from('user_documents')
    .select('*')
    .eq('user_id', userId);

  if (documentsError) {
    console.error('❌ Erreur:', documentsError.message);
  } else {
    console.log('✅ Accès OK -', documents.length, 'document(s) trouvé(s)');
  }

  // Test user_deadlines
  console.log('\n--- Table: user_deadlines ---');
  const { data: deadlines, error: deadlinesError } = await supabase
    .from('user_deadlines')
    .select('*')
    .eq('user_id', userId);

  if (deadlinesError) {
    console.error('❌ Erreur:', deadlinesError.message);
  } else {
    console.log('✅ Accès OK -', deadlines.length, 'échéance(s) trouvée(s)');
  }

  // Test children (via family_profiles)
  console.log('\n--- Table: children ---');
  if (profiles && profiles.length > 0) {
    const { data: children, error: childrenError } = await supabase
      .from('children')
      .select('*')
      .eq('family_id', profiles[0].id);

    if (childrenError) {
      console.error('❌ Erreur:', childrenError.message);
    } else {
      console.log('✅ Accès OK -', children.length, 'enfant(s) trouvé(s)');
    }
  } else {
    console.log('⚠️  Pas de profil famille, impossible de tester');
  }

  // Test lecture publique des aides
  console.log('\n--- Table: aides (public) ---');
  const { data: aidesPublic, error: aidesPublicError } = await supabase
    .from('aides')
    .select('*')
    .limit(5);

  if (aidesPublicError) {
    console.error('❌ Erreur:', aidesPublicError.message);
  } else {
    console.log('✅ Accès OK -', aidesPublic.length, 'aide(s) publique(s)');
  }

  console.log('\n✅ Diagnostic terminé!\n');

  // Résumé
  console.log('📋 RÉSUMÉ:');
  console.log('- Connexion Supabase:', '✅');
  console.log('- Authentification:', currentSession ? '✅' : '❌');
  console.log('- Profils:', profilesError ? '❌' : '✅');
  console.log('- Aides:', aidesError ? '❌' : '✅');
  console.log('- Documents:', documentsError ? '❌' : '✅');
  console.log('- Échéances:', deadlinesError ? '❌' : '✅');
  console.log('- Aides publiques:', aidesPublicError ? '❌' : '✅');
}

testConnection().catch(console.error);