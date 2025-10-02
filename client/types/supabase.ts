// 🤖 Types TypeScript générés depuis le schéma Supabase
// Généré automatiquement - NE PAS MODIFIER À LA MAIN

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      family_profiles: {
        Row: {
          id: string
          user_id: string
          name: string | null
          situation: 'parent_solo' | 'couple' | 'autre' | null
          departement: string | null
          nb_enfants: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string | null
          situation?: 'parent_solo' | 'couple' | 'autre' | null
          departement?: string | null
          nb_enfants?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string | null
          situation?: 'parent_solo' | 'couple' | 'autre' | null
          departement?: string | null
          nb_enfants?: number
          created_at?: string
          updated_at?: string
        }
      }
      children: {
        Row: {
          id: string
          family_id: string
          name: string
          age: number | null
          handicap_type: string | null
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          age?: number | null
          handicap_type?: string | null
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          age?: number | null
          handicap_type?: string | null
          description?: string | null
          created_at?: string
        }
      }
      user_aides: {
        Row: {
          id: string
          user_id: string
          nom: string
          montant: string | null
          statut: 'actif' | 'en_attente' | 'refuse'
          echeance: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nom: string
          montant?: string | null
          statut?: 'actif' | 'en_attente' | 'refuse'
          echeance?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nom?: string
          montant?: string | null
          statut?: 'actif' | 'en_attente' | 'refuse'
          echeance?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_documents: {
        Row: {
          id: string
          user_id: string
          nom: string
          type: string | null
          file_url: string | null
          analysis: string | null
          statut: 'valide' | 'expire' | 'expire_bientot'
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nom: string
          type?: string | null
          file_url?: string | null
          analysis?: string | null
          statut?: 'valide' | 'expire' | 'expire_bientot'
          date?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nom?: string
          type?: string | null
          file_url?: string | null
          analysis?: string | null
          statut?: 'valide' | 'expire' | 'expire_bientot'
          date?: string
          created_at?: string
        }
      }
      user_deadlines: {
        Row: {
          id: string
          user_id: string
          titre: string
          date: string
          type: 'renouvellement' | 'rdv' | 'demarche'
          priorite: 'haute' | 'moyenne' | 'basse'
          completed: boolean
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          titre: string
          date: string
          type?: 'renouvellement' | 'rdv' | 'demarche'
          priorite?: 'haute' | 'moyenne' | 'basse'
          completed?: boolean
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          titre?: string
          date?: string
          type?: 'renouvellement' | 'rdv' | 'demarche'
          priorite?: 'haute' | 'moyenne' | 'basse'
          completed?: boolean
          description?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          messages: Json
          context: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          messages?: Json
          context?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          messages?: Json
          context?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_memories: {
        Row: {
          id: string
          user_id: string
          memory_content: string
          memory_type: string
          importance_score: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          memory_content: string
          memory_type?: string
          importance_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          memory_content?: string
          memory_type?: string
          importance_score?: number
          created_at?: string
          updated_at?: string
        }
      }
      aides: {
        Row: {
          id: string
          nom: string
          description: string | null
          organisme: string | null
          region: string | null
          type_handicap: string[] | null
          montant_min: number | null
          montant_max: number | null
          conditions: Json
          documents_requis: string[] | null
          url_info: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nom: string
          description?: string | null
          organisme?: string | null
          region?: string | null
          type_handicap?: string[] | null
          montant_min?: number | null
          montant_max?: number | null
          conditions?: Json
          documents_requis?: string[] | null
          url_info?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nom?: string
          description?: string | null
          organisme?: string | null
          region?: string | null
          type_handicap?: string[] | null
          montant_min?: number | null
          montant_max?: number | null
          conditions?: Json
          documents_requis?: string[] | null
          url_info?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 🎯 Types helpers pour faciliter l'utilisation
export type FamilyProfile = Database['public']['Tables']['family_profiles']['Row']
export type Child = Database['public']['Tables']['children']['Row']
export type UserAide = Database['public']['Tables']['user_aides']['Row']
export type UserDocument = Database['public']['Tables']['user_documents']['Row']
export type UserDeadline = Database['public']['Tables']['user_deadlines']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type UserMemory = Database['public']['Tables']['user_memories']['Row']
export type Aide = Database['public']['Tables']['aides']['Row']

// Types pour les insertions
export type FamilyProfileInsert = Database['public']['Tables']['family_profiles']['Insert']
export type ChildInsert = Database['public']['Tables']['children']['Insert']
export type UserAideInsert = Database['public']['Tables']['user_aides']['Insert']
export type UserDocumentInsert = Database['public']['Tables']['user_documents']['Insert']
export type UserDeadlineInsert = Database['public']['Tables']['user_deadlines']['Insert']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type UserMemoryInsert = Database['public']['Tables']['user_memories']['Insert']
export type AideInsert = Database['public']['Tables']['aides']['Insert']

// Types pour les mises à jour
export type FamilyProfileUpdate = Database['public']['Tables']['family_profiles']['Update']
export type ChildUpdate = Database['public']['Tables']['children']['Update']
export type UserAideUpdate = Database['public']['Tables']['user_aides']['Update']
export type UserDocumentUpdate = Database['public']['Tables']['user_documents']['Update']
export type UserDeadlineUpdate = Database['public']['Tables']['user_deadlines']['Update']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']
export type UserMemoryUpdate = Database['public']['Tables']['user_memories']['Update']
export type AideUpdate = Database['public']['Tables']['aides']['Update']
