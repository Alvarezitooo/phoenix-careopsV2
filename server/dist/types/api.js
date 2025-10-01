// Types pour les erreurs courantes
export const API_ERROR_CODES = {
    // Authentification
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    // Resources
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    // Rate limiting
    RATE_LIMITED: 'RATE_LIMITED',
    // Serveur
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',
    // Upload
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    UPLOAD_FAILED: 'UPLOAD_FAILED',
};
// Helpers pour créer des réponses typées
export function createSuccessResponse(data, meta) {
    return {
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta,
        },
    };
}
export function createErrorResponse(code, message, details) {
    return {
        error: {
            code,
            message,
            details,
        },
        meta: {
            timestamp: new Date().toISOString(),
        },
    };
}
export function createValidationError(field, message) {
    return {
        error: {
            code: API_ERROR_CODES.VALIDATION_ERROR,
            message,
            field,
        },
        meta: {
            timestamp: new Date().toISOString(),
        },
    };
}
//# sourceMappingURL=api.js.map