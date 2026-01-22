# ===============================================
# 🕊️ PHOENIXCARE - DOCKERFILE BACKEND (Python/FastAPI)
# ===============================================
# Pour déploiement sur Railway (Backend uniquement)
# Le frontend Next.js sera déployé séparément
# ===============================================

FROM python:3.11-slim-bookworm as base

# Métadonnées
LABEL maintainer="PhoenixCare Team"
LABEL description="Backend FastAPI pour PhoenixCare - Assistance numérique pour parents d'enfants en situation de handicap"

# Variables d'environnement Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# ===============================================
# Stage 1: Dependencies
# ===============================================
FROM base as dependencies

# Installer les outils de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Créer le répertoire de travail
WORKDIR /app

# Copier et installer les dépendances Python
COPY server/requirements.txt .
RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install --no-cache-dir -r requirements.txt

# ===============================================
# Stage 2: Production
# ===============================================
FROM base as production

# Installer uniquement curl pour les health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Créer utilisateur non-root
RUN useradd -u 10001 -m appuser

# Créer le répertoire de travail
WORKDIR /app

# Copier les dépendances Python depuis le stage précédent
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copier le code du serveur
COPY server/ .

# Créer les répertoires nécessaires
RUN mkdir -p /app/logs /app/data && \
    chown -R appuser:appuser /app

# Changer vers l'utilisateur non-root
USER appuser

# Port par défaut (Railway utilisera la variable PORT)
ENV PORT=8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

# Démarrage avec uvicorn
# Railway injecte automatiquement la variable PORT
CMD python -m uvicorn main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8080} \
    --workers 2 \
    --proxy-headers \
    --forwarded-allow-ips='*'
