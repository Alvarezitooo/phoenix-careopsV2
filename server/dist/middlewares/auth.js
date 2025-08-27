export const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token)
        return res.status(401).json({ error: 'Non autorisé' });
    // À améliorer avec JWT réel
    next();
};
//# sourceMappingURL=auth.js.map