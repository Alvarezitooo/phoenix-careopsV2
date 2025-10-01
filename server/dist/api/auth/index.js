import express from 'express';
import jwt from 'jsonwebtoken';
import { API_ERRORS } from '../../utils/errors.js';
export const authRouter = express.Router();
// --- ATTENTION : Utilisateur de test temporaire ---
// À remplacer par une vérification en base de données dès que possible.
const MOCK_USER = {
    id: 'user-phoenix-001',
    email: 'test@phoenix.care',
    password: 'password123', // En production, on comparera un hash, jamais un mot de passe en clair.
    name: 'Parent Testeur'
};
/**
 * Route de connexion
 * POST /api/auth/login
 */
authRouter.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({
            error: {
                code: API_ERRORS.VALIDATION_FAILED,
                message: "L'email et le mot de passe sont requis."
            }
        });
    }
    // Vérification des identifiants (logique de test)
    if (email !== MOCK_USER.email || password !== MOCK_USER.password) {
        return res.status(401).json({
            error: {
                code: API_ERRORS.UNAUTHORIZED,
                message: "Les identifiants sont incorrects."
            }
        });
    }
    // Création du Payload pour le token
    const payload = {
        userId: MOCK_USER.id,
        email: MOCK_USER.email,
        name: MOCK_USER.name
    };
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('FATAL: JWT_SECRET n\'est pas défini dans les variables d\'environnement.');
        return res.status(500).json({ error: { code: API_ERRORS.UNKNOWN } });
    }
    // Génération du token
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
    // Envoi du token dans un cookie sécurisé
    res.cookie('phoenix-auth-token', token, {
        httpOnly: true, // Le cookie n'est pas accessible en JavaScript côté client
        secure: process.env.NODE_ENV === 'production', // Uniquement en HTTPS en production
        sameSite: 'strict', // Protection contre les attaques CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
    });
    // Réponse de succès
    res.status(200).json({ user: payload });
});
/**
 * Route de vérification de session
 * GET /api/auth/me
 */
authRouter.get('/me', (req, res) => {
    // Si on arrive ici, c'est que le authMiddleware a validé le token.
    // Les informations de l'utilisateur sont dans req.user.
    if (req.user) {
        res.status(200).json({ user: req.user });
    }
    else {
        // Ce cas ne devrait pas arriver si le middleware est bien en place
        res.status(401).json({ error: { code: API_ERRORS.UNAUTHORIZED } });
    }
});
/**
 * Route de déconnexion
 * POST /api/auth/logout
 */
authRouter.post('/logout', (_req, res) => {
    res.clearCookie('phoenix-auth-token');
    res.status(200).json({ message: 'Déconnexion réussie.' });
});
//# sourceMappingURL=index.js.map