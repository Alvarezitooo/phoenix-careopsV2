# ===============================================
# 🕊️ PHOENIXCARE - DOCKERFILE FRONTEND (Next.js)
# ===============================================
# Pour déploiement sur Railway (Frontend uniquement)
# Communique avec le backend via NEXT_PUBLIC_API_URL
# ===============================================

FROM node:18-alpine AS base

# ===============================================
# Stage 1: Dependencies
# ===============================================
FROM base AS dependencies

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production && \
    npm cache clean --force

# ===============================================
# Stage 2: Builder
# ===============================================
FROM base AS builder

WORKDIR /app

# Copier les dépendances depuis le stage précédent
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./

# Installer toutes les dépendances (y compris dev)
RUN npm ci

# Copier le code source
COPY . .

# Variables d'environnement pour le build
# Ces variables seront injectées par Railway au build time
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Build Next.js
RUN npm run build

# ===============================================
# Stage 3: Production
# ===============================================
FROM base AS production

WORKDIR /app

# Créer utilisateur non-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Changer vers l'utilisateur non-root
USER nextjs

# Port par défaut (Railway utilisera la variable PORT)
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:${PORT}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrage
CMD HOSTNAME="0.0.0.0" node server.js
