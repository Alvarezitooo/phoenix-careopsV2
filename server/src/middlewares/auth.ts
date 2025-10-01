
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { API_ERRORS } from '../utils/errors.js';

// Étend l'interface Request d'Express pour inclure notre payload utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: { 
        userId: string;
        email: string;
        name: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies['phoenix-auth-token'];

  if (!token) {
    return res.status(401).json({ 
      error: { 
        code: API_ERRORS.UNAUTHORIZED, 
        message: "Aucun token d'authentification fourni."
      }
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('FATAL: JWT_SECRET n\'est pas défini pour la validation du token.');
    return res.status(500).json({ error: { code: API_ERRORS.UNKNOWN } });
  }

  try {
    // Vérifier le token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; name: string; };

    // Attacher les informations de l'utilisateur à la requête
    req.user = decoded;

    // Passer au prochain middleware ou à la route
    next();
  } catch (error) {
    // Gérer les erreurs de token (expiré, invalide, etc.)
    return res.status(401).json({ 
      error: { 
        code: API_ERRORS.INVALID_TOKEN,
        message: "Token invalide ou expiré."
      }
    });
  }
};
