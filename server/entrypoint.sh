#!/bin/bash
# ===================================
# 🚀 ENTRYPOINT PHOENIXCARE - PRODUCTION
# ===================================
# Script d'entrypoint robuste pour Railway
# French Tech best practices

set -e  # Exit on error

echo "============================================"
echo "🚀 PHOENIXCARE BACKEND - STARTING"
echo "============================================"

# Activer le venv
source /opt/venv/bin/activate

# Vérifications de santé
echo "✓ Python version: $(python --version)"
echo "✓ Uvicorn installed: $(python -m uvicorn --version)"
echo "✓ Working directory: $(pwd)"
echo "✓ Files: $(ls -la | head -5)"

# Variables d'environnement Railway
export PORT=${PORT:-8080}
export HOST=${HOST:-0.0.0.0}
export WORKERS=${WORKERS:-4}

echo "============================================"
echo "🌐 Starting server on $HOST:$PORT"
echo "👥 Workers: $WORKERS"
echo "============================================"

# Lancer uvicorn via python module (pas de binaire direct)
exec python -m uvicorn main:app \
    --host "$HOST" \
    --port "$PORT" \
    --workers "$WORKERS" \
    --log-level info \
    --proxy-headers \
    --forwarded-allow-ips='*'
