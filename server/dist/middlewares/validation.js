import { ZodError, z } from 'zod';
import { ValidationError } from '../utils/errors.js';
/**
 * Middleware de validation Zod générique
 */
export function validate(schema, options = {}) {
    const { target = 'body', stripUnknown = true, allowEmpty = false } = options;
    return (req, res, next) => {
        try {
            // Récupérer les données à valider selon la cible
            const dataToValidate = req[target];
            // Vérifier si les données sont vides et si c'est autorisé
            if (!dataToValidate && !allowEmpty) {
                throw new ValidationError(`${target} is required`);
            }
            // Si les données sont vides mais autorisées, passer au middleware suivant
            if (!dataToValidate && allowEmpty) {
                return next();
            }
            // Valider les données avec Zod
            const validatedData = schema.parse(dataToValidate);
            // Remplacer les données originales par les données validées
            if (stripUnknown) {
                req[target] = validatedData;
            }
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                // Convertir l'erreur Zod en format plus lisible
                const details = error.errors.reduce((acc, curr) => {
                    const field = curr.path.join('.');
                    acc[field] = curr.message;
                    return acc;
                }, {});
                const validationError = new ValidationError(`Validation failed for ${target}`, details);
                return next(validationError);
            }
            // Si ce n'est pas une erreur Zod, la passer au gestionnaire d'erreurs
            next(error);
        }
    };
}
/**
 * Middleware pour valider le body d'une requête
 */
export function validateBody(schema, options) {
    return validate(schema, { ...options, target: 'body' });
}
/**
 * Middleware pour valider les query parameters
 */
export function validateQuery(schema, options) {
    return validate(schema, { ...options, target: 'query' });
}
/**
 * Middleware pour valider les route parameters
 */
export function validateParams(schema, options) {
    return validate(schema, { ...options, target: 'params' });
}
/**
 * Validation combinée pour plusieurs cibles
 */
export function validateRequest(schemas) {
    return [
        ...(schemas.params ? [validateParams(schemas.params)] : []),
        ...(schemas.query ? [validateQuery(schemas.query)] : []),
        ...(schemas.body ? [validateBody(schemas.body)] : []),
    ];
}
// Utilitaires pour des validations communes
export const commonValidations = {
    // ID UUID
    uuidParam: validate(z.object({
        id: z.string().uuid('ID invalide'),
    }), { target: 'params' }),
    // Pagination
    pagination: validateQuery(z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        sort: z.string().optional(),
        order: z.enum(['asc', 'desc']).default('desc'),
    })),
    // Recherche
    search: validateQuery(z.object({
        q: z.string().min(1).optional(),
        category: z.string().optional(),
        status: z.string().optional(),
    })),
};
//# sourceMappingURL=validation.js.map