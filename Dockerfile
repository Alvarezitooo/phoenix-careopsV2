# 🕊️ PhoenixCare - Dockerfile Multi-Stage Optimisé
# 🔥 PRODUCTION READY : 1 Process, 1 Port, 0 Zombie, 0 Proxy
# 🏗️  ARCHITECTURE : Custom Next Server + Express (mono-process)

# =============================================================================
# ---- STAGE 1 : BUILDER (Construction optimisée)
# =============================================================================
FROM node:18-alpine AS builder
LABEL org.opencontainers.image.title="PhoenixCare Builder"

# Variables d'environnement pour le build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Installation des outils de build système
RUN apk add --no-cache libc6-compat git

# Création des répertoires de travail
WORKDIR /app

# Copie des fichiers package.json pour optimiser le cache Docker
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Installation des dépendances serveur (backend) - toutes pour le build
RUN cd server && npm ci && npm cache clean --force

# Installation des dépendances client (frontend) - toutes pour le build
RUN cd client && npm ci && npm cache clean --force

# Copie du code source complet
COPY server/ ./server/
COPY client/ ./client/

# Build du backend TypeScript
RUN cd server && npm run build

# Build du frontend Next.js (production)
RUN cd client && npm run build

# =============================================================================
# ---- STAGE 2 : RUNNER (Image de production ultra-légère)
# =============================================================================
FROM node:18-alpine AS runner
LABEL org.opencontainers.image.title="PhoenixCare"
LABEL org.opencontainers.image.description="Plateforme d'assistance numérique pour parents d'enfants en situation de handicap"
LABEL org.opencontainers.image.authors="PhoenixCare Team"

# 🔥 TINI pour gestion des signaux (PID 1 propre)
RUN apk add --no-cache tini curl
ENTRYPOINT ["/sbin/tini", "--"]

# Variables d'environnement pour Railway
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 phoenixcare && \
    adduser --system --uid 1001 phoenixcare

# Création des répertoires nécessaires
WORKDIR /app

# Copie des fichiers package.json (pour référence uniquement)
COPY --from=builder --chown=phoenixcare:phoenixcare /app/server/package*.json ./server/
COPY --from=builder --chown=phoenixcare:phoenixcare /app/client/package*.json ./client/

# Installation UNIQUEMENT des dépendances de production
RUN cd server && npm ci --only=production && npm cache clean --force && \
    cd ../client && npm ci --only=production && npm cache clean --force

# Copie des builds optimisés uniquement
COPY --from=builder --chown=phoenixcare:phoenixcare /app/server/dist ./server/dist
COPY --from=builder --chown=phoenixcare:phoenixcare /app/client/.next ./client/.next
COPY --from=builder --chown=phoenixcare:phoenixcare /app/client/public ./client/public

# Copie du script de démarrage
COPY --chown=phoenixcare:phoenixcare start.sh ./start.sh
RUN chmod +x ./start.sh

# Copie des autres fichiers de configuration si nécessaire
COPY --chown=phoenixcare:phoenixcare server/tsconfig.json ./server/
COPY --chown=phoenixcare:phoenixcare client/next.config.mjs ./client/

# Changement vers l'utilisateur non-root
USER phoenixcare

# Exposition du port (Railway utilisera $PORT)
EXPOSE 8080

# 🏥 Health Check intégré (liveness probe)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/healthz || exit 1

# =============================================================================
# 🔥 DÉMARRAGE OPTIMISÉ (1 seul process, gestion des signaux)
# =============================================================================
CMD ["./start.sh"]
