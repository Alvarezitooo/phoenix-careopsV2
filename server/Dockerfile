# ---- Base ----
FROM python:3.11-slim-bookworm

# Confiance & perf
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

# Outils nécessaires (uvicorn[standard] peut tirer httptools/uvloop/ujson)
# + curl pour le HEALTHCHECK
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl \
 && rm -rf /var/lib/apt/lists/*

# Répertoire d'app
WORKDIR /app

# 1) Installer les deps de manière globale et déterministe
#    (on copie uniquement le requirements pour maximiser le cache)
COPY requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel \
 && python -m pip install -r requirements.txt

# 2) Copier le code (uniquement après install des deps)
COPY . .

# 3) Utilisateur non-root (sécurité)
RUN useradd -u 10001 -m appuser \
 && chown -R appuser:appuser /app
USER 10001

# Réseau
ENV PORT=8080
EXPOSE 8080

# Healthcheck — utilise curl (fiable, pas besoin d'installer requests)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/health" || exit 1

# Démarrage — Railway injecte $PORT dynamique, on utilise sh -lc pour l'expansion
CMD ["sh","-lc","uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 4 --proxy-headers"]
