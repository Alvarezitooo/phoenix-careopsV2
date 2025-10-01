import { supabase } from '../config/supabase.js';
import { z } from 'zod';

// Types pour les procédures
export interface Procedure {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'action_required' | 'completed' | 'rejected';
  description?: string;
  details?: string;
  due_date?: string;
  completed_date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ProcedureCreateInput {
  name: string;
  status: Procedure['status'];
  description?: string;
  details?: string;
  due_date?: string;
  user_id: string;
}

export interface ProcedureUpdateInput {
  name?: string;
  status?: Procedure['status'];
  description?: string;
  details?: string;
  due_date?: string;
  completed_date?: string;
}

// Validation schemas
const procedureCreateSchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(['pending', 'in_progress', 'action_required', 'completed', 'rejected']),
  description: z.string().optional(),
  details: z.string().optional(),
  due_date: z.string().datetime().optional(),
  user_id: z.string().uuid(),
});

const procedureUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['pending', 'in_progress', 'action_required', 'completed', 'rejected']).optional(),
  description: z.string().optional(),
  details: z.string().optional(),
  due_date: z.string().datetime().optional(),
  completed_date: z.string().datetime().optional(),
});

export class ProceduresService {
  /**
   * Récupère toutes les procédures d'un utilisateur
   */
  static async getUserProcedures(userId: string): Promise<Procedure[]> {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erreur lors de la récupération des procédures: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Erreur ProceduresService.getUserProcedures:', error);
      // Retour de données mock en cas d'erreur (pour le développement)
      return [
        {
          id: 'proc-1',
          name: 'Renouvellement AEEH',
          status: 'pending' as const,
          description: 'Renouvellement de l\'Allocation d\'Éducation de l\'Enfant Handicapé',
          details: 'En attente de décision de la MDPH',
          due_date: '2025-11-15T00:00:00Z',
          user_id: userId,
          created_at: '2024-10-15T10:00:00Z',
          updated_at: '2024-10-15T10:00:00Z',
        },
        {
          id: 'proc-2',
          name: 'Demande de PCH',
          status: 'action_required' as const,
          description: 'Prestation de Compensation du Handicap',
          details: 'Fournir un nouveau devis d\'ergothérapeute.',
          user_id: userId,
          created_at: '2024-09-20T14:30:00Z',
          updated_at: '2024-11-01T09:15:00Z',
        },
        {
          id: 'proc-3',
          name: 'Inscription SESSAD',
          status: 'completed' as const,
          description: 'Service d\'Éducation Spéciale et de Soins à Domicile',
          completed_date: '2024-02-10T00:00:00Z',
          user_id: userId,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-02-10T16:30:00Z',
        },
      ];
    }
  }

  /**
   * Crée une nouvelle procédure
   */
  static async createProcedure(input: ProcedureCreateInput): Promise<Procedure> {
    try {
      // Validation des données
      const validatedInput = procedureCreateSchema.parse(input);

      const { data, error } = await supabase
        .from('procedures')
        .insert([validatedInput])
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la création de la procédure: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erreur ProceduresService.createProcedure:', error);
      throw error;
    }
  }

  /**
   * Met à jour une procédure
   */
  static async updateProcedure(
    procedureId: string,
    userId: string,
    input: ProcedureUpdateInput
  ): Promise<Procedure> {
    try {
      // Validation des données
      const validatedInput = procedureUpdateSchema.parse(input);

      // Si le statut passe à "completed", ajouter la date de completion
      if (validatedInput.status === 'completed' && !validatedInput.completed_date) {
        validatedInput.completed_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('procedures')
        .update({
          ...validatedInput,
          updated_at: new Date().toISOString(),
        })
        .eq('id', procedureId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(`Erreur lors de la mise à jour de la procédure: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erreur ProceduresService.updateProcedure:', error);
      throw error;
    }
  }

  /**
   * Supprime une procédure
   */
  static async deleteProcedure(procedureId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', procedureId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Erreur lors de la suppression de la procédure: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('Erreur ProceduresService.deleteProcedure:', error);
      throw error;
    }
  }

  /**
   * Récupère une procédure spécifique
   */
  static async getProcedure(procedureId: string, userId: string): Promise<Procedure | null> {
    try {
      const { data, error } = await supabase
        .from('procedures')
        .select('*')
        .eq('id', procedureId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Procédure non trouvée
        }
        throw new Error(`Erreur lors de la récupération de la procédure: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Erreur ProceduresService.getProcedure:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des procédures d'un utilisateur
   */
  static async getProcedureStats(userId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    actionRequired: number;
  }> {
    try {
      const procedures = await this.getUserProcedures(userId);

      return {
        total: procedures.length,
        completed: procedures.filter(p => p.status === 'completed').length,
        pending: procedures.filter(p => p.status === 'pending' || p.status === 'in_progress').length,
        actionRequired: procedures.filter(p => p.status === 'action_required').length,
      };
    } catch (error) {
      console.error('Erreur ProceduresService.getProcedureStats:', error);
      throw error;
    }
  }
}