# 🕊️ PhoenixCare - Dockerfile Multi-Stage Optimisé
# 🔥 PRODUCTION READY : 1 Process, 1 Port, 0 Zombie, 0 Proxy
# 🏗️  ARCHITECTURE : Custom Next Server + Express (mono-process)

# =========================
# deps: installe TOUTES les deps (incl. dev) pour builder
# =========================
FROM node:20-alpine AS deps
WORKDIR /app

# Copie les manifests d'abord pour profiter du cache
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/

# Installe via workspaces (inclut devDeps, nécessaire pour tsc/next build)
RUN npm ci --workspaces

# =========================
# builder: copie le code et build
# =========================
FROM node:20-alpine AS builder
WORKDIR /app

# Récupère node_modules (toutes deps) depuis l'étape deps
COPY --from=deps /app /app

# Copie le reste du code source
COPY . .

# Build backend + frontend
RUN npm run build:server && npm run build:client

# =========================
# runner: image prod minimale (sans devDeps)
# =========================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080

# Copie uniquement manifests
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/

# Installe uniquement les prod deps
RUN npm ci --workspaces --omit=dev

# Copie les artefacts de build
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/.next ./client/.next
COPY --from=builder /app/client/public ./client/public

# Copie des fichiers de config nécessaires
COPY server/tsconfig.json ./server/
COPY client/next.config.mjs ./client/

EXPOSE 8080
ENV PORT=8080 NODE_ENV=production
CMD ["node", "server/dist/server.js"]
