/**
 * 🕊️ PhoenixCare - Gestion d'Erreurs Centralisée
 *
 * Ce fichier centralise la gestion des erreurs avec logging structuré,
 * types cohérents et middleware Express pour une expérience développeur optimale.
 */
import { ZodError } from 'zod';
import { loggers } from './logger.js';
import { API_ERROR_CODES, createErrorResponse } from '../types/api.js';
// Classes d'erreurs personnalisées
export class AppError extends Error {
    statusCode;
    code;
    isOperational;
    details;
    constructor(message, statusCode, code, isOperational = true, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
export class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, API_ERROR_CODES.VALIDATION_ERROR, true, details);
    }
}
export class AuthenticationError extends AppError {
    constructor(message = 'Non authentifié') {
        super(message, 401, API_ERROR_CODES.UNAUTHORIZED);
    }
}
export class AuthorizationError extends AppError {
    constructor(message = 'Accès refusé') {
        super(message, 403, API_ERROR_CODES.FORBIDDEN);
    }
}
export class NotFoundError extends AppError {
    constructor(resource = 'Ressource') {
        super(`${resource} non trouvé(e)`, 404, API_ERROR_CODES.NOT_FOUND);
    }
}
export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, API_ERROR_CODES.ALREADY_EXISTS);
    }
}
export class RateLimitError extends AppError {
    constructor(message = 'Trop de requêtes') {
        super(message, 429, API_ERROR_CODES.RATE_LIMITED);
    }
}
export class InternalServerError extends AppError {
    constructor(message = 'Erreur interne du serveur') {
        super(message, 500, API_ERROR_CODES.INTERNAL_ERROR, false);
    }
}
export class DatabaseError extends AppError {
    constructor(message = 'Erreur de base de données') {
        super(message, 500, API_ERROR_CODES.DATABASE_ERROR, false);
    }
}
// Middleware de gestion d'erreurs centralisé
export const errorHandler = (err, req, res, next) => {
    let error = err;
    // Log de l'erreur
    loggers.error('Error occurred', error, {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        userId: req.user?.userId,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
    });
    // Convertir les erreurs Zod en ValidationError
    if (error instanceof ZodError) {
        const details = error.errors.reduce((acc, curr) => {
            const field = curr.path.join('.');
            acc[field] = curr.message;
            return acc;
        }, {});
        error = new ValidationError('Données invalides', details);
    }
    // Convertir les erreurs Mongoose/Supabase
    if (error.name === 'CastError') {
        error = new ValidationError('ID invalide');
    }
    if (error.name === 'ValidationError') {
        error = new ValidationError('Données invalides');
    }
    // Erreurs JWT
    if (error.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Token invalide');
    }
    if (error.name === 'TokenExpiredError') {
        error = new AuthenticationError('Token expiré');
    }
    // Si ce n'est pas une erreur opérationnelle, la convertir
    if (!(error instanceof AppError)) {
        error = new InternalServerError();
    }
    const appError = error;
    // Créer la réponse d'erreur
    const errorResponse = createErrorResponse(appError.code, appError.message, appError.details);
    // Ajouter l'ID de requête pour le debugging
    if (req.requestId) {
        errorResponse.meta.requestId = req.requestId;
    }
    // En développement, ajouter la stack trace
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = appError.stack;
    }
    res.status(appError.statusCode).json(errorResponse);
};
// Middleware pour capturer les erreurs asynchrones
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
// Middleware pour les routes non trouvées
export const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.originalUrl}`);
    next(error);
};
// Utilitaires pour créer des erreurs communes
export const createError = {
    validation: (message, details) => new ValidationError(message, details),
    unauthorized: (message) => new AuthenticationError(message),
    forbidden: (message) => new AuthorizationError(message),
    notFound: (resource) => new NotFoundError(resource),
    conflict: (message) => new ConflictError(message),
    rateLimit: (message) => new RateLimitError(message),
    internal: (message) => new InternalServerError(message),
    database: (message) => new DatabaseError(message),
};
// Export des constantes pour compatibilité avec l'ancien code
export const API_ERRORS = {
    // Erreurs Génériques
    UNKNOWN: 'UNKNOWN_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    // Erreurs de Validation
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    // Erreurs d'Authentification
    UNAUTHORIZED: 'UNAUTHORIZED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    FORBIDDEN: 'FORBIDDEN',
    RATE_LIMITED: 'RATE_LIMITED',
    // Erreurs de Base de Données
    DB_FETCH_FAILED: 'DB_FETCH_FAILED',
    DB_SAVE_FAILED: 'DB_SAVE_FAILED',
    DB_DELETE_FAILED: 'DB_DELETE_FAILED',
    // Erreurs de Service Externe (ex: IA)
    AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
    EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
};
//# sourceMappingURL=errors.js.map