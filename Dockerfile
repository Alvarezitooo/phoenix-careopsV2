# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

# 1) Manifests pour cache
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/

# 2) Installe toutes deps (incl. dev) pour builder Next/tsc
RUN npm ci --workspaces

# ---------- builder ----------
FROM node:20-alpine AS builder
WORKDIR /app

# 1) Récupère node_modules du stage deps
COPY --from=deps /app /app

# 2) Copie le code source
COPY . .

# 3) Build backend + frontend
RUN npm run build:server && npm run build:client

# ---------- runner ----------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080

# 1) Manifests pour install prod
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/

# 2) Installe uniquement les deps runtime (Next doit être en dependencies dans client/)
RUN npm ci --workspaces --omit=dev

# 3) Copie artefacts buildés aux bons endroits
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/.next ./client/.next
# Si tu as un dossier public/ :
COPY --from=builder /app/client/public ./client/public

EXPOSE 8080
CMD ["node","server/dist/server.js"]
