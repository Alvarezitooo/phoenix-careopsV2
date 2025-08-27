
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
import apiRouter from './api/index.js';
import { authMiddleware } from './middlewares/auth.js';

// Configuration
dotenv.config();
const dev = process.env.NODE_ENV !== 'production';
const port = Number(process.env.PORT) || 8080;

// 🔥 Initialisation Next.js avec répertoire client
// ✅ Utilise path.resolve pour pointer vers /app/client depuis /app
const clientDir = path.resolve('../client');
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

    // 1) Base
    server.set("trust proxy", 1);
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));

    // 2) Health publics
    server.get("/healthz", (_req, res) => res.status(200).json({ status: "ok" }));
    server.get("/readyz", (_req, res) => res.status(200).json({ status: "ready" }));

    // 3) 🧪 Routes diagnostiques (temporaire)
    server.get("/api/ping", (_req, res) => res.json({ pong: true, t: Date.now() }));
    server.get("/api/debug", (req, res) => res.json({
      method: req.method,
      path: req.path,
      ip: req.ip,
      cookies: req.headers.cookie || null,
      ua: req.headers['user-agent'],
      host: req.headers.host,
    }));

    // 4) ⬅️ API avant Next (IMPORTANT)
    //    ⚠️ TEMP : aucune auth ici pour isoler le problème
    server.use("/api", apiRouter);

    // 5) Next pour tout le reste
    server.all("*", (req, res) => nextHandle(req, res));

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
