"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token)
        return res.status(401).json({ error: 'Non autorisé' });
    // À améliorer avec JWT réel
    next();
};
exports.authMiddleware = authMiddleware;
