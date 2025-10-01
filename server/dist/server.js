import express from 'express';
import next from 'next';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// Import des routes et middlewares
import { authRouter } from './api/auth/index.js';
import apiRouter from './api/index.js';
import { authMiddleware } from './middlewares/auth.js';
import { env } from './config/env.js';
import { API_ERRORS } from './utils/errors.js';
import { loggers, requestLogger } from './utils/logger.js';
import { errorHandler } from './utils/errors.js';
// Configuration
const dev = env.NODE_ENV !== 'production';
const port = env.PORT;
const allowAllOrigins = env.allowedOrigins.includes('*');
const corsOptions = {
    origin: (origin, callback) => {
        if (allowAllOrigins || !origin || env.allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        console.warn(`❌ Requête refusée par CORS depuis l'origine: ${origin}`);
        return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
};
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
        res.status(429).json({
            error: {
                code: API_ERRORS.RATE_LIMITED,
                message: 'Trop de requêtes, merci de réessayer dans quelques instants.',
            },
        });
    },
});
// 🔥 Initialisation Next.js avec répertoire client
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, '../../client');
const nextApp = next({
    dev,
    dir: clientDir
});
const nextHandle = nextApp.getRequestHandler();
// 🚀 Démarrage asynchrone
(async () => {
    try {
        await nextApp.prepare();
        loggers.system('Next.js initialized successfully');
        const server = express();
        // 1) Middlewares de base et de sécurité
        server.set("trust proxy", 1);
        // Logger des requêtes (doit être en premier)
        server.use(requestLogger);
        // Durcissement HTTP de base
        server.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false,
        }));
        server.use(limiter);
        // Configuration CORS pour autoriser le frontend
        server.use(cors(corsOptions));
        server.use(express.json());
        server.use(express.urlencoded({ extended: true }));
        server.use(cookieParser());
        // 2) Routes publiques (health checks, authentification)
        server.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));
        server.get("/readyz", (_req, res) => res.status(200).json({ status: "ready" }));
        server.use("/api/auth", authRouter);
        // 3) Routes API protégées
        server.use("/api", authMiddleware, apiRouter);
        // 4) Gestionnaire Next.js pour toutes les autres requêtes (pages frontend)
        server.all("*", (req, res) => nextHandle(req, res));
        // 5) Gestion d'erreurs centralisée (doit être en dernier)
        server.use(errorHandler);
        // 🎉 Démarrage du serveur unifié
        server.listen(port, () => {
            loggers.system('PhoenixCare server started successfully', {
                port,
                environment: env.NODE_ENV,
                allowedOrigins: allowAllOrigins ? ['*'] : env.allowedOrigins,
            });
        });
    }
    catch (error) {
        loggers.error('Failed to start server', error);
        process.exit(1);
    }
})();
// Export pour les tests
export default nextApp;
//# sourceMappingURL=server.js.map