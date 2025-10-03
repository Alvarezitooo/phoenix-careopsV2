# ===================================
# 🚀 DOCKERFILE PHOENIXCARE - FASTAPI
# ===================================
# Single-stage build (SIMPLE = FIABLE)
# Python 3.11 + FastAPI + Uvicorn

FROM python:3.11-slim

WORKDIR /app

# Copier requirements et code
COPY requirements.txt .
COPY . .

# Installer directement (pas de venv, on est déjà isolé dans Docker)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Variables d'environnement
ENV PYTHONUNBUFFERED=1

# Port exposé (Railway utilise $PORT dynamique)
EXPOSE 8080

# ===== HEALTHCHECK =====
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health', timeout=3)"

# ===== COMMANDE DE DÉMARRAGE =====
# Single-stage = python directement disponible + shell pour $PORT
CMD ["/bin/sh", "-c", "python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 4 --log-level info"]
