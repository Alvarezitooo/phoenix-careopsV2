import winston from 'winston';
import { env } from '../config/env.js';
// Configuration des formats de log
const logFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
}), winston.format.errors({ stack: true }), winston.format.json(), winston.format.prettyPrint());
// Configuration pour la production
const productionFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
// Configuration pour le développement
const developmentFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
}), winston.format.errors({ stack: true }), winston.format.colorize(), winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logMessage = `${timestamp} ${level}: ${message}`;
    if (stack) {
        logMessage += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
// Création du logger
export const logger = winston.createLogger({
    level: env.LOG_LEVEL || 'info',
    format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
    defaultMeta: {
        service: 'phoenix-care-api',
        version: process.env.npm_package_version || '1.0.0',
    },
    transports: [
        // Console transport
        new winston.transports.Console({
            stderrLevels: ['error'],
        }),
    ],
});
// En production, ajouter un transport pour les fichiers
if (env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Fonctions utilitaires pour différents types de logs
export const loggers = {
    // Log des requêtes HTTP
    request: (message, context) => {
        logger.info(message, {
            type: 'request',
            ...context,
        });
    },
    // Log des erreurs
    error: (message, error, context) => {
        logger.error(message, {
            type: 'error',
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : undefined,
            ...context,
        });
    },
    // Log des événements de sécurité
    security: (message, context) => {
        logger.warn(message, {
            type: 'security',
            ...context,
        });
    },
    // Log des événements métier
    business: (message, context) => {
        logger.info(message, {
            type: 'business',
            ...context,
        });
    },
    // Log des performances
    performance: (message, context) => {
        logger.info(message, {
            type: 'performance',
            ...context,
        });
    },
    // Log des événements système
    system: (message, context) => {
        logger.info(message, {
            type: 'system',
            ...context,
        });
    },
};
// Middleware pour logger les requêtes Express
export const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    // Ajouter l'ID de requête à l'objet req pour traçabilité
    req.requestId = requestId;
    // Log de la requête entrante
    loggers.request('Incoming request', {
        requestId,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id,
    });
    // Intercepter la réponse
    const originalSend = res.send;
    res.send = function (data) {
        const responseTime = Date.now() - start;
        // Log de la réponse
        loggers.request('Request completed', {
            requestId,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            userId: req.user?.id,
        });
        // Si la réponse prend plus de 1 seconde, logger comme performance
        if (responseTime > 1000) {
            loggers.performance('Slow request detected', {
                requestId,
                method: req.method,
                url: req.originalUrl,
                duration: responseTime,
                userId: req.user?.id,
            });
        }
        return originalSend.call(this, data);
    };
    next();
};
// Gestionnaire d'erreurs non capturées
process.on('uncaughtException', (error) => {
    loggers.error('Uncaught Exception', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    loggers.error('Unhandled Rejection', new Error(reason));
});
export default logger;
//# sourceMappingURL=logger.js.map