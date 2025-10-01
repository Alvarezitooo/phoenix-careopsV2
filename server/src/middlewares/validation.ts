import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, z } from 'zod';
import { ValidationError } from '../utils/errors.js';

// Types pour spécifier quelle partie de la requête valider
export type ValidateTarget = 'body' | 'query' | 'params';

// Interface pour les options de validation
export interface ValidationOptions {
  target?: ValidateTarget;
  stripUnknown?: boolean;
  allowEmpty?: boolean;
}

/**
 * Middleware de validation Zod générique
 */
export function validate(
  schema: ZodSchema,
  options: ValidationOptions = {}
) {
  const { target = 'body', stripUnknown = true, allowEmpty = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
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
    } catch (error) {
      if (error instanceof ZodError) {
        // Convertir l'erreur Zod en format plus lisible
        const details = error.errors.reduce((acc, curr) => {
          const field = curr.path.join('.');
          acc[field] = curr.message;
          return acc;
        }, {} as Record<string, string>);

        const validationError = new ValidationError(
          `Validation failed for ${target}`,
          details
        );
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
export function validateBody(schema: ZodSchema, options?: Omit<ValidationOptions, 'target'>) {
  return validate(schema, { ...options, target: 'body' });
}

/**
 * Middleware pour valider les query parameters
 */
export function validateQuery(schema: ZodSchema, options?: Omit<ValidationOptions, 'target'>) {
  return validate(schema, { ...options, target: 'query' });
}

/**
 * Middleware pour valider les route parameters
 */
export function validateParams(schema: ZodSchema, options?: Omit<ValidationOptions, 'target'>) {
  return validate(schema, { ...options, target: 'params' });
}

/**
 * Validation combinée pour plusieurs cibles
 */
export function validateRequest(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) {
  return [
    ...(schemas.params ? [validateParams(schemas.params)] : []),
    ...(schemas.query ? [validateQuery(schemas.query)] : []),
    ...(schemas.body ? [validateBody(schemas.body)] : []),
  ];
}

// Utilitaires pour des validations communes
export const commonValidations = {
  // ID UUID
  uuidParam: validate(
    z.object({
      id: z.string().uuid('ID invalide'),
    }),
    { target: 'params' as const }
  ),

  // Pagination
  pagination: validateQuery(
    z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).default('desc'),
    })
  ),

  // Recherche
  search: validateQuery(
    z.object({
      q: z.string().min(1).optional(),
      category: z.string().optional(),
      status: z.string().optional(),
    })
  ),
};