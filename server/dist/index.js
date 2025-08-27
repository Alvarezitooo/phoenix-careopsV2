"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 🌿 PhoenixCare - Backend Architecture de Base (Modulaire & Extensible)
 *
 * Cette architecture est conçue pour un projet national sérieux, sécurisé et maintenable.
 * Le code est structuré par domaine fonctionnel, avec des dossiers indépendants et une organisation claire.
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const body_parser_1 = require("body-parser");
const path_1 = __importDefault(require("path"));
const aides_1 = require("./routes/aides");
const auth_1 = require("./middlewares/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware de base
app.use((0, cors_1.default)());
app.use((0, body_parser_1.json)());
app.use(auth_1.authMiddleware);
// API routes
app.use('/api/aides', aides_1.aideRouter);
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'PhoenixCare API 🕊️ Healthy',
        timestamp: new Date().toISOString()
    });
});
// Servir les fichiers statiques du frontend (Next.js build)
const staticPath = path_1.default.join(__dirname, '../client/.next/static');
if (require('fs').existsSync(staticPath)) {
    app.use('/_next/static', express_1.default.static(staticPath));
}
// Servir les autres assets du frontend
const publicPath = path_1.default.join(__dirname, '../client/public');
if (require('fs').existsSync(publicPath)) {
    app.use(express_1.default.static(publicPath));
}
// Catch-all handler: envoyer toutes les requêtes non-API vers le frontend
app.get('*', (req, res) => {
    // Pour les routes API, passer au middleware suivant
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    // Pour les autres routes, servir l'index du frontend
    const indexPath = path_1.default.join(__dirname, '../client/.next/server/app/index.html');
    if (require('fs').existsSync(indexPath)) {
        res.sendFile(indexPath);
    }
    else {
        // Fallback si le fichier n'existe pas
        res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PhoenixCare</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .logo { font-size: 3em; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🕊️</div>
            <h1>PhoenixCare</h1>
            <p>Plateforme d'assistance numérique pour parents d'enfants en situation de handicap</p>
            <p>🚀 Mission : Construire les outils que l'État ne fournit pas</p>
          </div>
        </body>
      </html>
    `);
    }
});
// API info endpoint
app.get('/api', (_req, res) => {
    res.send({
        message: 'PhoenixCare API 🕊️ OK',
        port: PORT,
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            aides: '/api/aides'
        }
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
exports.default = app;
