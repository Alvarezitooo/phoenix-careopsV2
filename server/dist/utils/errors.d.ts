/**
 * 🕊️ PhoenixCare - Gestion d'Erreurs Centralisée
 *
 * Ce fichier centralise la gestion des erreurs avec logging structuré,
 * types cohérents et middleware Express pour une expérience développeur optimale.
 */
import { Request, Response, NextFunction } from 'express';
import { ApiErrorCode } from '../types/api.js';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: ApiErrorCode;
    readonly isOperational: boolean;
    readonly details?: Record<string, any>;
    constructor(message: string, statusCode: number, code: ApiErrorCode, isOperational?: boolean, details?: Record<string, any>);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: Record<string, any>);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string);
}
export declare class InternalServerError extends AppError {
    constructor(message?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message?: string);
}
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => void;
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
export declare const notFoundHandler: (req: Request, res: Response, next: NextFunction) => void;
export declare const createError: {
    validation: (message: string, details?: Record<string, any>) => ValidationError;
    unauthorized: (message?: string) => AuthenticationError;
    forbidden: (message?: string) => AuthorizationError;
    notFound: (resource?: string) => NotFoundError;
    conflict: (message: string) => ConflictError;
    rateLimit: (message?: string) => RateLimitError;
    internal: (message?: string) => InternalServerError;
    database: (message?: string) => DatabaseError;
};
export declare const API_ERRORS: {
    readonly UNKNOWN: "UNKNOWN_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_FAILED: "VALIDATION_FAILED";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly DB_FETCH_FAILED: "DB_FETCH_FAILED";
    readonly DB_SAVE_FAILED: "DB_SAVE_FAILED";
    readonly DB_DELETE_FAILED: "DB_DELETE_FAILED";
    readonly AI_SERVICE_ERROR: "AI_SERVICE_ERROR";
    readonly EXTERNAL_SERVICE_UNAVAILABLE: "EXTERNAL_SERVICE_UNAVAILABLE";
};
//# sourceMappingURL=errors.d.ts.map