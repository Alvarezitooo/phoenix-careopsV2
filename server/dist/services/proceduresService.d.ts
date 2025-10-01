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
export declare class ProceduresService {
    /**
     * Récupère toutes les procédures d'un utilisateur
     */
    static getUserProcedures(userId: string): Promise<Procedure[]>;
    /**
     * Crée une nouvelle procédure
     */
    static createProcedure(input: ProcedureCreateInput): Promise<Procedure>;
    /**
     * Met à jour une procédure
     */
    static updateProcedure(procedureId: string, userId: string, input: ProcedureUpdateInput): Promise<Procedure>;
    /**
     * Supprime une procédure
     */
    static deleteProcedure(procedureId: string, userId: string): Promise<boolean>;
    /**
     * Récupère une procédure spécifique
     */
    static getProcedure(procedureId: string, userId: string): Promise<Procedure | null>;
    /**
     * Récupère les statistiques des procédures d'un utilisateur
     */
    static getProcedureStats(userId: string): Promise<{
        total: number;
        completed: number;
        pending: number;
        actionRequired: number;
    }>;
}
//# sourceMappingURL=proceduresService.d.ts.map