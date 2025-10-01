// 🗄️ Configuration Supabase pour Phoenix (Client Browser)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client simple pour compatibilité avec le code existant
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') return null;
        return document.cookie
          .split('; ')
          .find(row => row.startsWith(`${key}=`))
          ?.split('=')[1] || null;
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') return;
        document.cookie = `${key}=${value}; path=/; max-age=31536000; SameSite=Lax`;
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') return;
        document.cookie = `${key}=; path=/; max-age=0`;
      },
    },
  },
});

// Types pour la base de données Phoenix
export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface FamilyProfile {
  id: string;
  user_id: string;
  situation: 'parent_solo' | 'couple' | 'autre';
  departement?: string;
  nb_enfants: number;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  age: number;
  handicap_type?: string;
  description?: string;
  created_at: string;
}

export interface Aide {
  id: string;
  user_id: string;
  nom: string;
  montant: string;
  statut: 'actif' | 'en_attente' | 'refuse';
  echeance?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  nom: string;
  type: string;
  file_url?: string;
  analysis?: string;
  statut: 'valide' | 'expire' | 'expire_bientot';
  date: string;
  created_at: string;
}

export interface Deadline {
  id: string;
  user_id: string;
  titre: string;
  date: string;
  type: 'renouvellement' | 'rdv' | 'demarche';
  priorite: 'haute' | 'moyenne' | 'basse';
  completed: boolean;
  description?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  messages: any[];
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  context: string;
  content: any;
  created_at: string;
}