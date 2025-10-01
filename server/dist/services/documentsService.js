import { supabase } from '../config/supabase.js';
import { z } from 'zod';
// Validation schema
const documentCreateSchema = z.object({
    name: z.string().min(1).max(255),
    file_path: z.string().min(1),
    mime_type: z.string().min(1),
    size: z.number().positive(),
    user_id: z.string().uuid(),
});
export class DocumentsService {
    /**
     * Récupère tous les documents d'un utilisateur
     */
    static async getUserDocuments(userId) {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) {
                throw new Error(`Erreur lors de la récupération des documents: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            console.error('Erreur DocumentsService.getUserDocuments:', error);
            // Retour de données mock en cas d'erreur (pour le développement)
            return [
                {
                    id: 'doc-1',
                    name: 'Dossier MDPH 2023.pdf',
                    file_path: '/uploads/mdph-2023.pdf',
                    mime_type: 'application/pdf',
                    size: 2411520, // 2.3 MB
                    user_id: userId,
                    created_at: '2023-10-15T10:00:00Z',
                    updated_at: '2023-10-15T10:00:00Z',
                },
                {
                    id: 'doc-2',
                    name: 'Compte-rendu pédiatrique.docx',
                    file_path: '/uploads/pediatrique-2024.docx',
                    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    size: 1153433, // 1.1 MB
                    user_id: userId,
                    created_at: '2024-01-20T14:30:00Z',
                    updated_at: '2024-01-20T14:30:00Z',
                },
                {
                    id: 'doc-3',
                    name: 'Devis ergothérapeute.pdf',
                    file_path: '/uploads/devis-ergo.pdf',
                    mime_type: 'application/pdf',
                    size: 819200, // 800 KB
                    user_id: userId,
                    created_at: '2024-03-01T09:00:00Z',
                    updated_at: '2024-03-01T09:00:00Z',
                },
            ];
        }
    }
    /**
     * Crée un nouveau document
     */
    static async createDocument(input) {
        try {
            // Validation des données
            const validatedInput = documentCreateSchema.parse(input);
            const { data, error } = await supabase
                .from('documents')
                .insert([validatedInput])
                .select()
                .single();
            if (error) {
                throw new Error(`Erreur lors de la création du document: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('Erreur DocumentsService.createDocument:', error);
            throw error;
        }
    }
    /**
     * Supprime un document
     */
    static async deleteDocument(documentId, userId) {
        try {
            const { error } = await supabase
                .from('documents')
                .delete()
                .eq('id', documentId)
                .eq('user_id', userId);
            if (error) {
                throw new Error(`Erreur lors de la suppression du document: ${error.message}`);
            }
            return true;
        }
        catch (error) {
            console.error('Erreur DocumentsService.deleteDocument:', error);
            throw error;
        }
    }
    /**
     * Récupère un document spécifique
     */
    static async getDocument(documentId, userId) {
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', documentId)
                .eq('user_id', userId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Document non trouvé
                }
                throw new Error(`Erreur lors de la récupération du document: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('Erreur DocumentsService.getDocument:', error);
            throw error;
        }
    }
}
//# sourceMappingURL=documentsService.js.map