
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
  res.send({ message: 'PhoenixCare API 🕊️ OK' });
});

// Exporte l'application pour Vercel
export default app;
