
/**
 * 🌿 PhoenixCare - Backend Architecture de Base (Modulaire & Extensible)
 *
 * Cette architecture est conçue pour un projet national sérieux, sécurisé et maintenable.
 * Le code est structuré par domaine fonctionnel, avec des dossiers indépendants et une organisation claire.
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { json } from 'body-parser';

import { aideRouter } from './routes/aides';
import { authMiddleware } from './middlewares/auth';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(json());
app.use(authMiddleware);
app.use('/api/aides', aideRouter);

app.get('/', (_req, res) => {
  res.send({
    message: 'PhoenixCare API 🕊️ OK',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Démarrage du serveur pour Railway (port dynamique)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 PhoenixCare Backend démarré sur le port ${PORT}`);
    console.log(`📍 API accessible sur http://localhost:${PORT}`);
    console.log(`💝 Mission: Construire les outils que l'État ne fournit pas`);
  });
}

// Exporte l'application pour les tests et autres usages
export default app;
