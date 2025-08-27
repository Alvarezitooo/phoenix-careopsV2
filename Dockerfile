# PhoenixCare - Architecture Monolitique Optimisée
# Mission: Construire les outils numériques que l'État ne fournit pas
# Philosophie: "Ce n'est pas du code, c'est de la compassion compilée"

FROM node:18-alpine AS base

# Labels pour identifier l'application
LABEL org.opencontainers.image.title="PhoenixCare"
LABEL org.opencontainers.image.description="Plateforme d'assistance numérique pour parents d'enfants en situation de handicap"
LABEL org.opencontainers.image.authors="PhoenixCare Team"
LABEL org.opencontainers.image.version="1.0.0"

# Installation des dépendances système
RUN apk add --no-cache libc6-compat

# Variables d'environnement
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# =============================================================================
# ETAPE 1: Préparation des dépendances
# =============================================================================

# Copie des fichiers package.json pour optimiser le cache Docker
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Installation des dépendances serveur (backend)
RUN cd server && npm ci --only=production && npm cache clean --force

# Installation des dépendances client (frontend) - avec dev dependencies pour le build
RUN cd client && npm ci && npm cache clean --force

# =============================================================================
# ETAPE 2: Construction des applications
# =============================================================================

# Copie du code source et construction
COPY server/ ./server/
COPY client/ ./client/

# Build du backend TypeScript
RUN cd server && npm run build

# Build du frontend Next.js
RUN cd client && npm run build

# =============================================================================
# ETAPE 3: Image finale de production
# =============================================================================

FROM node:18-alpine AS production

# Labels de production
LABEL org.opencontainers.image.title="PhoenixCare Production"
LABEL org.opencontainers.image.description="Production image for PhoenixCare platform"

# Variables d'environnement pour Railway
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Installation des dépendances système minimales
RUN apk add --no-cache libc6-compat

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 phoenixcare
RUN adduser --system --uid 1001 phoenixcare

WORKDIR /app

# =============================================================================
# Copie des builds optimisés depuis l'étape de construction
# =============================================================================

# Copie du backend compilé
COPY --from=base --chown=phoenixcare:phoenixcare /app/server/dist ./server/dist
COPY --from=base --chown=phoenixcare:phoenixcare /app/server/package.json ./server/
COPY --from=base --chown=phoenixcare:phoenixcare /app/server/node_modules ./server/node_modules

# Copie du frontend build
COPY --from=base --chown=phoenixcare:phoenixcare /app/client/.next ./client/.next
COPY --from=base --chown=phoenixcare:phoenixcare /app/client/public ./client/public
COPY --from=base --chown=phoenixcare:phoenixcare /app/client/package.json ./client/
COPY --from=base --chown=phoenixcare:phoenixcare /app/client/next.config.mjs ./client/
COPY --from=base --chown=phoenixcare:phoenixcare /app/client/node_modules ./client/node_modules

# =============================================================================
# Configuration de l'utilisateur non-root
# =============================================================================
USER phoenixcare

# Exposition du port (Railway utilisera son propre port dynamique)
EXPOSE 3000

# =============================================================================
# Script de démarrage unifié
# =============================================================================
COPY --chown=phoenixcare:phoenixcare <<EOF /app/start.sh
#!/bin/sh
echo "🚀 Démarrage PhoenixCare - Architecture Monolitique"
echo "💝 Mission: Construire les outils que l'État ne fournit pas"
echo "🔌 Port dynamique Railway: \$PORT"

# Fonction de nettoyage
cleanup() {
    echo "🧹 Nettoyage des processus..."
    kill \$BACKEND_PID 2>/dev/null || true
    kill \$FRONTEND_PID 2>/dev/null || true
    wait
    exit 0
}

# Gestion des signaux d'arrêt
trap cleanup TERM INT

# Démarrage du backend en arrière-plan
echo "🏥 Démarrage du serveur backend..."
cd /app/server && PORT=\$PORT node dist/index.js &
BACKEND_PID=\$!

# Attente que le backend soit prêt
sleep 5

# Démarrage du frontend en arrière-plan
echo "⚛️ Démarrage du client frontend..."
cd /app/client && PORT=\$PORT npm start &
FRONTEND_PID=\$!

echo "✅ PhoenixCare opérationnel sur le port \$PORT"
echo "🌐 Frontend: http://localhost:\$PORT"
echo "🔧 Backend API: http://localhost:\$PORT/api"

# Attente des processus
wait \$BACKEND_PID \$FRONTEND_PID
EOF

# Rendre le script exécutable
RUN chmod +x /app/start.sh

# =============================================================================
# Point d'entrée optimisé
# =============================================================================
CMD ["/app/start.sh"]

# =============================================================================
# Health Check pour Railway
# =============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + process.env.PORT + '/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"
