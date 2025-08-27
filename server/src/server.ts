
/**
 * 🕊️ PhoenixCare - Architecture Monolitique Optimisée
 *
 * 🔥 SOLUTION RECOMMANDÉE : Custom Next Server + Express
 * ✅ 1 seul processus Node.js
 * ✅ 1 seul port Railway
 * ✅ 0 conflit, 0 proxy, 0 zombie process
 *
 * Architecture : Express gère les API, Next.js gère les pages/assets
 * Tout dans un seul container Docker avec PID 1 propre
 */

import express from 'express';
import next from 'next';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'node:path';

// Import des routes et middlewares
import { aideRouter } from './routes/aides.js';
import { authMiddleware } from './middlewares/auth.js';

// Configuration
dotenv.config();
const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT) || 8080;

// 🔥 Initialisation Next.js avec répertoire client
// ✅ Utilise path.resolve pour pointer vers /app/client depuis /app
const clientDir = path.resolve('client');
const nextApp = next({
  dev,
  dir: clientDir  // Répertoire du frontend Next.js
});

const nextHandle = nextApp.getRequestHandler();

// 🚀 Démarrage asynchrone (pattern recommandé pour Next.js)
(async () => {
  try {
    // Préparation de Next.js
    await nextApp.prepare();
    console.log('✅ Next.js prêt');

    // Création du serveur Express
    const server = express();

    // =============================================================================
    // 🛡️ SÉCURITÉ EXPRESS - Configuration renforcée
    // =============================================================================

    // 1️⃣ HELMET - Sécurisation des headers HTTP
    server.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://*.supabase.co"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      noSniff: true,
      xssFilter: true,
      referrerPolicy: { policy: "strict-origin-when-cross-origin" }
    }));

    // 2️⃣ RATE LIMITING - Protection contre les attaques par déni de service
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limite chaque IP à 100 requêtes par windowMs
      message: {
        error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
        retryAfter: 900 // secondes
      },
      standardHeaders: true, // retourne `RateLimit-*` headers
      legacyHeaders: false, // désactive les headers `X-RateLimit-*`
      skip: (req) => req.path === '/healthz' || req.path === '/readyz' // exempt health checks
    });
    server.use(limiter);

    // Rate limiting plus strict pour les routes d'authentification
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limite chaque IP à 5 tentatives d'auth par windowMs
      message: {
        error: 'Trop de tentatives d\'authentification, veuillez réessayer plus tard.',
        retryAfter: 900
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    // 3️⃣ COOKIE PARSER - Gestion sécurisée des cookies JWT
    server.use(cookieParser());

    // 4️⃣ CORS SÉCURISÉ - Origines explicitement autorisées
    server.use(cors({
      origin: (origin, callback) => {
        const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

        // Autorise les requêtes sans origine (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Origine non autorisée par la politique CORS'));
        }
      },
      credentials: true, // Autorise les cookies et l'authentification
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // 🏥 Health Checks (PUBLIQUES - AVANT l'authentification !)
    server.get('/healthz', (_req, res) => {
      res.status(200).json({
        status: 'OK',
        service: 'PhoenixCare',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        security: {
          helmet: 'enabled',
          rateLimit: 'enabled',
          cors: 'enabled',
          cookies: 'enabled'
        }
      });
    });

    server.get('/readyz', (_req, res) => {
      // Ici vous pourriez ajouter des checks de dépendances (DB, etc.)
      res.status(200).json({
        status: 'READY',
        service: 'PhoenixCare',
        timestamp: new Date().toISOString(),
        dependencies: {
          nextjs: 'ready',
          database: 'pending' // À implémenter selon vos besoins
        }
      });
    });

    // Middleware de base
    server.use(express.json({ limit: '10mb' })); // Limite la taille du body
    server.use(authMiddleware);

    // 🔥 Gestion d'erreur CORS améliorée
    server.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
          error: 'CORS Error',
          message: 'Origine non autorisée',
          details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
      }
      next(err);
    });

    // 🔗 API Routes Express
    server.use('/api/aides', aideRouter);

    // 📊 API Info
    server.get('/api', (_req, res) => {
      res.json({
        message: 'PhoenixCare API 🕊️ OK',
        version: '1.0.0',
        port,
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/healthz',
          ready: '/readyz',
          aides: '/api/aides'
        }
      });
    });

    // 🎯 Catch-all : Next.js gère toutes les autres routes
    // 🔥 C'est ici que la magie opère : Express délègue à Next.js
    server.all('*', (req, res) => {
      return nextHandle(req, res);
    });

    // 🎉 Démarrage du serveur unifié
    server.listen(port, () => {
      console.log(`🚀 PhoenixCare démarré sur le port ${port}`);
      console.log(`📍 URL: http://localhost:${port}`);
      console.log(`🔥 Architecture: Custom Next Server + Express`);
      console.log(`💝 Mission: Construire les outils que l'État ne fournit pas`);
      console.log(`🏥 Health checks: /healthz, /readyz`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage:', error);
    process.exit(1);
  }
})();

// Export pour les tests
export default nextApp;
