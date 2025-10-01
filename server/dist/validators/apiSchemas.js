import { z } from 'zod';
// Schémas de base réutilisables
export const baseSchemas = {
    // ID UUID
    uuid: z.string().uuid('ID invalide'),
    // Email
    email: z.string().email('Email invalide'),
    // Mot de passe (au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre)
    password: z
        .string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
        .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
        .regex(/\d/, 'Le mot de passe doit contenir au moins un chiffre'),
    // Nom (2-50 caractères, lettres et espaces)
    name: z
        .string()
        .min(2, 'Le nom doit contenir au moins 2 caractères')
        .max(50, 'Le nom ne peut pas dépasser 50 caractères')
        .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
    // Téléphone (format français)
    phone: z
        .string()
        .regex(/^(?:\+33|0)[1-9](?:[.\-\s]?\d{2}){4}$/, 'Numéro de téléphone invalide')
        .optional(),
    // URL
    url: z.string().url('URL invalide').optional(),
    // Date ISO
    isoDate: z.string().datetime('Date invalide'),
    // Pagination
    pagination: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        sort: z.string().optional(),
        order: z.enum(['asc', 'desc']).default('desc'),
    }),
};
// Schémas d'authentification
export const authSchemas = {
    login: z.object({
        email: baseSchemas.email,
        password: z.string().min(1, 'Mot de passe requis'),
    }),
    register: z.object({
        email: baseSchemas.email,
        password: baseSchemas.password,
        name: baseSchemas.name,
    }),
    forgotPassword: z.object({
        email: baseSchemas.email,
    }),
    resetPassword: z.object({
        token: z.string().min(1, 'Token requis'),
        password: baseSchemas.password,
    }),
    changePassword: z.object({
        currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
        newPassword: baseSchemas.password,
    }),
};
// Schémas pour les documents
export const documentSchemas = {
    create: z.object({
        name: z
            .string()
            .min(1, 'Nom du document requis')
            .max(255, 'Le nom ne peut pas dépasser 255 caractères'),
        file_path: z.string().min(1, 'Chemin du fichier requis'),
        mime_type: z.string().min(1, 'Type MIME requis'),
        size: z.number().positive('La taille doit être positive'),
    }),
    update: z.object({
        name: z
            .string()
            .min(1, 'Nom du document requis')
            .max(255, 'Le nom ne peut pas dépasser 255 caractères')
            .optional(),
    }),
    search: z.object({
        q: z.string().min(1).optional(),
        type: z.string().optional(),
        category: z.string().optional(),
        ...baseSchemas.pagination.shape,
    }),
};
// Schémas pour les procédures
export const procedureSchemas = {
    create: z.object({
        name: z
            .string()
            .min(1, 'Nom de la procédure requis')
            .max(255, 'Le nom ne peut pas dépasser 255 caractères'),
        status: z.enum(['pending', 'in_progress', 'action_required', 'completed', 'rejected']),
        description: z.string().max(1000, 'La description ne peut pas dépasser 1000 caractères').optional(),
        details: z.string().max(2000, 'Les détails ne peuvent pas dépasser 2000 caractères').optional(),
        due_date: baseSchemas.isoDate.optional(),
    }),
    update: z.object({
        name: z
            .string()
            .min(1, 'Nom de la procédure requis')
            .max(255, 'Le nom ne peut pas dépasser 255 caractères')
            .optional(),
        status: z.enum(['pending', 'in_progress', 'action_required', 'completed', 'rejected']).optional(),
        description: z.string().max(1000, 'La description ne peut pas dépasser 1000 caractères').optional(),
        details: z.string().max(2000, 'Les détails ne peuvent pas dépasser 2000 caractères').optional(),
        due_date: baseSchemas.isoDate.optional(),
        completed_date: baseSchemas.isoDate.optional(),
    }),
    search: z.object({
        q: z.string().min(1).optional(),
        status: z.enum(['pending', 'in_progress', 'action_required', 'completed', 'rejected']).optional(),
        category: z.string().optional(),
        due_date_from: baseSchemas.isoDate.optional(),
        due_date_to: baseSchemas.isoDate.optional(),
        ...baseSchemas.pagination.shape,
    }),
};
// Schémas pour les aides
export const aideSchemas = {
    search: z.object({
        q: z.string().min(1).optional(),
        category: z.string().optional(),
        location: z.string().optional(),
        eligibility: z.string().optional(),
        amount_min: z.coerce.number().min(0).optional(),
        amount_max: z.coerce.number().min(0).optional(),
        ...baseSchemas.pagination.shape,
    }),
    create: z.object({
        title: z
            .string()
            .min(1, 'Titre requis')
            .max(255, 'Le titre ne peut pas dépasser 255 caractères'),
        description: z
            .string()
            .min(1, 'Description requise')
            .max(2000, 'La description ne peut pas dépasser 2000 caractères'),
        category: z.string().min(1, 'Catégorie requise'),
        eligibility: z.array(z.string()).min(1, 'Au moins un critère d\'éligibilité requis'),
        amount: z.string().optional(),
        duration: z.string().optional(),
        contact: z.object({
            name: z.string().min(1, 'Nom du contact requis'),
            phone: baseSchemas.phone,
            email: baseSchemas.email.optional(),
            website: baseSchemas.url,
        }),
    }),
    update: z.object({
        title: z
            .string()
            .min(1, 'Titre requis')
            .max(255, 'Le titre ne peut pas dépasser 255 caractères')
            .optional(),
        description: z
            .string()
            .min(1, 'Description requise')
            .max(2000, 'La description ne peut pas dépasser 2000 caractères')
            .optional(),
        category: z.string().min(1, 'Catégorie requise').optional(),
        eligibility: z.array(z.string()).min(1, 'Au moins un critère d\'éligibilité requis').optional(),
        amount: z.string().optional(),
        duration: z.string().optional(),
        contact: z.object({
            name: z.string().min(1, 'Nom du contact requis'),
            phone: baseSchemas.phone,
            email: baseSchemas.email.optional(),
            website: baseSchemas.url,
        }).optional(),
    }),
};
// Schémas pour le chat
export const chatSchemas = {
    sendMessage: z.object({
        content: z
            .string()
            .min(1, 'Message requis')
            .max(4000, 'Le message ne peut pas dépasser 4000 caractères'),
        conversationId: baseSchemas.uuid.optional(),
    }),
    createConversation: z.object({
        title: z
            .string()
            .min(1, 'Titre requis')
            .max(100, 'Le titre ne peut pas dépasser 100 caractères')
            .optional(),
        initialMessage: z
            .string()
            .min(1, 'Message initial requis')
            .max(4000, 'Le message ne peut pas dépasser 4000 caractères'),
    }),
    updateConversation: z.object({
        title: z
            .string()
            .min(1, 'Titre requis')
            .max(100, 'Le titre ne peut pas dépasser 100 caractères')
            .optional(),
    }),
    searchConversations: z.object({
        q: z.string().min(1).optional(),
        ...baseSchemas.pagination.shape,
    }),
};
// Schémas pour les paramètres utilisateur
export const userSchemas = {
    updateProfile: z.object({
        name: baseSchemas.name.optional(),
        email: baseSchemas.email.optional(),
        phone: baseSchemas.phone,
        avatar: baseSchemas.url,
    }),
    updatePreferences: z.object({
        language: z.enum(['fr', 'en']).default('fr'),
        theme: z.enum(['light', 'dark', 'system']).default('system'),
        notifications: z.object({
            email: z.boolean().default(true),
            push: z.boolean().default(true),
            sms: z.boolean().default(false),
        }).default({}),
        accessibility: z.object({
            fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
            highContrast: z.boolean().default(false),
            reduceMotion: z.boolean().default(false),
        }).default({}),
    }),
};
// Schémas pour les fichiers
export const fileSchemas = {
    upload: z.object({
        name: z.string().min(1, 'Nom du fichier requis'),
        size: z.number().max(10 * 1024 * 1024, 'Le fichier ne peut pas dépasser 10MB'),
        type: z.string().refine((type) => {
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/jpeg',
                'image/png',
                'image/gif',
                'text/plain',
            ];
            return allowedTypes.includes(type);
        }, 'Type de fichier non autorisé'),
    }),
};
// Schémas pour les paramètres de requête courants
export const querySchemas = {
    idParam: z.object({
        id: baseSchemas.uuid,
    }),
    search: z.object({
        q: z.string().min(1).optional(),
        ...baseSchemas.pagination.shape,
    }),
    dateRange: z.object({
        from: baseSchemas.isoDate.optional(),
        to: baseSchemas.isoDate.optional(),
        ...baseSchemas.pagination.shape,
    }),
};
// Export de tous les schémas
export const schemas = {
    base: baseSchemas,
    auth: authSchemas,
    documents: documentSchemas,
    procedures: procedureSchemas,
    aides: aideSchemas,
    chat: chatSchemas,
    user: userSchemas,
    file: fileSchemas,
    query: querySchemas,
};
//# sourceMappingURL=apiSchemas.js.map