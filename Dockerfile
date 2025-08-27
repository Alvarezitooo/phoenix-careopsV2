# Dockerfile monolithique PhoenixCare pour Railway
# Mission: Construire les outils numériques que l'État ne fournit pas
# Philosophie: "Ce n'est pas du code, c'est de la compassion compilée"

FROM node:18-alpine AS base

# Installation des dépendances système
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Configuration des variables d'environnement
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copie des fichiers de configuration et installation des dépendances
COPY apps/care-app-backend/package*.json ./apps/care-app-backend/
RUN cd apps/care-app-backend && npm ci --only=production && npm cache clean --force

COPY apps/care-app-frontend/package*.json ./apps/care-app-frontend/
RUN cd apps/care-app-frontend && npm ci --only=production && npm cache clean --force

# Build du frontend Next.js
FROM base AS frontend-builder
WORKDIR /app
COPY --from=base /app/apps/care-app-frontend/node_modules ./apps/care-app-frontend/node_modules
COPY apps/care-app-frontend ./apps/care-app-frontend
RUN cd apps/care-app-frontend && npm run build

# Build du backend TypeScript
FROM base AS backend-builder
WORKDIR /app
COPY --from=base /app/apps/care-app-backend/node_modules ./apps/care-app-backend/node_modules
COPY apps/care-app-backend ./apps/care-app-backend
RUN cd apps/care-app-backend && npm run build

# Image finale de production
FROM node:18-alpine AS production
WORKDIR /app

# Variables d'environnement pour Railway
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Installation des dépendances runtime uniquement
RUN apk add --no-cache libc6-compat

# Copie des node_modules de production depuis l'étape base
COPY --from=base /app/apps/care-app-frontend/node_modules ./frontend/node_modules
COPY --from=base /app/apps/care-app-backend/node_modules ./backend/node_modules

# Copie des builds optimisés
COPY --from=frontend-builder /app/apps/care-app-frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/apps/care-app-frontend/public ./frontend/public
COPY --from=frontend-builder /app/apps/care-app-frontend/package.json ./frontend/
COPY --from=frontend-builder /app/apps/care-app-frontend/next.config.mjs ./frontend/

COPY --from=backend-builder /app/apps/care-app-backend/dist ./backend/dist
COPY --from=backend-builder /app/apps/care-app-backend/package.json ./backend/

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 phoenixcare
RUN adduser --system --uid 1001 phoenixcare
USER phoenixcare

# Exposition du port Railway
EXPOSE 3000

# Script de démarrage unifié
COPY --chown=phoenixcare:phoenixcare <<EOF /app/start.sh
#!/bin/sh
echo "🚀 Démarrage PhoenixCare - Assistance numérique pour familles"
echo "💝 Mission: Construire les outils que l'État ne fournit pas"

# Démarrage du backend en arrière-plan
cd /app/backend && node dist/index.js &
BACKEND_PID=$!

# Démarrage du frontend
cd /app/frontend && npm start &
FRONTEND_PID=$!

# Gestion propre des signaux
trap 'kill $BACKEND_PID $FRONTEND_PID; wait' TERM INT

# Attente des processus
wait $BACKEND_PID $FRONTEND_PID
EOF

RUN chmod +x /app/start.sh

# Commande de démarrage
CMD ["/app/start.sh"]

# Labels pour Railway
LABEL org.opencontainers.image.title="PhoenixCare"
LABEL org.opencontainers.image.description="Plateforme d'assistance numérique pour parents d'enfants en situation de handicap"
LABEL org.opencontainers.image.vendor="PhoenixCare"
LABEL org.opencontainers.image.licenses="MIT"
