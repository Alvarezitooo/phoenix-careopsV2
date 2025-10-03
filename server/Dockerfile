# ===================================
# 🚀 DOCKERFILE PHOENIXCARE - FASTAPI
# ===================================
# Multi-stage build optimisé pour Railway
# Python 3.11 + FastAPI + Uvicorn

# ===== STAGE 1: BUILD =====
FROM python:3.11-slim as builder

WORKDIR /app

# Installation des dépendances système pour build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements et installer dans un venv
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Installation des packages Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# ===== STAGE 2: RUNTIME =====
FROM python:3.11-slim

WORKDIR /app

# Copier le venv depuis le stage builder (FIX du problème Railway/Nixpacks!)
COPY --from=builder /opt/venv /opt/venv

# Copier tout le code de l'application
COPY . .

# Copier et rendre exécutable l'entrypoint (permissions 755 explicites)
COPY entrypoint.sh /entrypoint.sh
RUN chmod 755 /entrypoint.sh

# Activer le venv pour tous les process
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Port exposé (Railway utilise $PORT dynamique)
EXPOSE 8080

# ===== HEALTHCHECK =====
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health', timeout=3)"

# ===== COMMANDE DE DÉMARRAGE =====
# FORCE bash explicite pour contourner les problèmes de permissions Railway
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
