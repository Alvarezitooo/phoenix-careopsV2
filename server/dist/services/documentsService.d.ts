export interface Document {
    id: string;
    name: string;
    file_path: string;
    mime_type: string;
    size: number;
    user_id: string;
    created_at: string;
    updated_at: string;
}
export interface DocumentCreateInput {
    name: string;
    file_path: string;
    mime_type: string;
    size: number;
    user_id: string;
}
export declare class DocumentsService {
    /**
     * Récupère tous les documents d'un utilisateur
     */
    static getUserDocuments(userId: string): Promise<Document[]>;
    /**
     * Crée un nouveau document
     */
    static createDocument(input: DocumentCreateInput): Promise<Document>;
    /**
     * Supprime un document
     */
    static deleteDocument(documentId: string, userId: string): Promise<boolean>;
    /**
     * Récupère un document spécifique
     */
    static getDocument(documentId: string, userId: string): Promise<Document | null>;
}
//# sourceMappingURL=documentsService.d.ts.map