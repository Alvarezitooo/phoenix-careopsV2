import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export type ValidateTarget = 'body' | 'query' | 'params';
export interface ValidationOptions {
    target?: ValidateTarget;
    stripUnknown?: boolean;
    allowEmpty?: boolean;
}
/**
 * Middleware de validation Zod générique
 */
export declare function validate(schema: ZodSchema, options?: ValidationOptions): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware pour valider le body d'une requête
 */
export declare function validateBody(schema: ZodSchema, options?: Omit<ValidationOptions, 'target'>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware pour valider les query parameters
 */
export declare function validateQuery(schema: ZodSchema, options?: Omit<ValidationOptions, 'target'>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Middleware pour valider les route parameters
 */
export declare function validateParams(schema: ZodSchema, options?: Omit<ValidationOptions, 'target'>): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validation combinée pour plusieurs cibles
 */
export declare function validateRequest(schemas: {
    body?: ZodSchema;
    query?: ZodSchema;
    params?: ZodSchema;
}): ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const commonValidations: {
    uuidParam: (req: Request, res: Response, next: NextFunction) => void;
    pagination: (req: Request, res: Response, next: NextFunction) => void;
    search: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=validation.d.ts.map