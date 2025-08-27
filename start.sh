#!/bin/bash
# 🕊️ PhoenixCare - Script de Démarrage Production
#
# 🔥 ARCHITECTURE : 1 seul processus Node.js (Custom Next Server + Express)
# ✅ Gestion des signaux UNIX (SIGTERM, SIGINT)
# ✅ Redémarrage automatique avec tini
# ✅ Variables d'environnement validées
# ✅ Logs structurés pour Railway
#
# Usage:
#   ./start.sh                    # Démarrage normal
#   ./start.sh --dev             # Mode développement
#   ./start.sh --health-check    # Test rapide des health checks
#
# Signaux gérés:
#   - SIGTERM: Arrêt propre (Railway)
#   - SIGINT: Arrêt immédiat (Ctrl+C)
#   - SIGHUP: Rechargement configuration (future feature)

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# =============================================================================
# Configuration & Variables d'environnement
# =============================================================================

# Port Railway (dynamique)
export PORT=${PORT:-8080}

# Environnement
export NODE_ENV=${NODE_ENV:-production}

# Variables obligatoires (fail fast si manquantes)
REQUIRED_VARS=("SUPABASE_URL" "SUPABASE_KEY")
for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ ERREUR: Variable requise manquante: $var"
    echo "📝 Définissez-la dans les variables d'environnement Railway"
    exit 1
  fi
done

# Variables optionnelles avec valeurs par défaut
export JWT_SECRET=${JWT_SECRET:-"CHANGE_ME_IN_PRODUCTION"}
export LOG_LEVEL=${LOG_LEVEL:-info}
export ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-"http://localhost:3000"}

# =============================================================================
# Fonctions utilitaires
# =============================================================================

# Logging structuré
log() {
  local level="$1"
  local message="$2"
  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
  echo "[$timestamp] [$level] $message"
}

# Validation de la santé du service
health_check() {
  local max_attempts=30
  local attempt=1

  log "INFO" "🔍 Vérification de la santé du service..."

  while [[ $attempt -le $max_attempts ]]; do
    if curl -f -s "http://localhost:$PORT/healthz" > /dev/null 2>&1; then
      log "INFO" "✅ Service sain après $attempt tentatives"
      return 0
    fi

    log "DEBUG" "Tentative $attempt/$max_attempts - Service pas encore prêt"
    sleep 2
    ((attempt++))
  done

  log "ERROR" "❌ Service toujours pas sain après $max_attempts tentatives"
  return 1
}

# Gestion propre des signaux
cleanup() {
  local signal="$1"
  log "WARN" "📡 Signal $signal reçu - Arrêt propre en cours..."

  # Ici vous pourriez ajouter :
  # - Fermeture des connexions DB
  # - Flush des logs
  # - Nettoyage des fichiers temporaires

  log "INFO" "👋 PhoenixCare arrêté proprement"
  exit 0
}

# =============================================================================
# Gestion des signaux UNIX
# =============================================================================

# Railway envoie SIGTERM pour l'arrêt propre
trap 'cleanup SIGTERM' SIGTERM

# Ctrl+C envoie SIGINT
trap 'cleanup SIGINT' SIGINT

# SIGHUP pour reconfiguration (future feature)
trap 'log "INFO" "🔄 SIGHUP reçu - Reconfiguration (non implémenté)"' SIGHUP

# =============================================================================
# Mode spécial : Health Check Rapide
# =============================================================================

if [[ "${1:-}" == "--health-check" ]]; then
  log "INFO" "🏥 Mode health-check activé"
  if curl -f -s "http://localhost:$PORT/healthz" > /dev/null 2>&1; then
    echo "✅ Service sain"
    exit 0
  else
    echo "❌ Service malade"
    exit 1
  fi
fi

# =============================================================================
# Préparation du démarrage
# =============================================================================

log "INFO" "🚀 Démarrage PhoenixCare..."
log "INFO" "📍 Port: $PORT"
log "INFO" "🌍 Environnement: $NODE_ENV"
log "INFO" "🔥 Architecture: Custom Next Server + Express"
log "INFO" "💝 Mission: Construire les outils que l'État ne fournit pas"

# Création du répertoire de logs si nécessaire
mkdir -p /tmp/phoenixcare-logs

# =============================================================================
# Démarrage de l'application
# =============================================================================

cd /app/server

if [[ "${1:-}" == "--dev" ]]; then
  log "INFO" "🛠️  Mode développement activé"
  exec npm run dev
else
  log "INFO" "🏭 Mode production activé"
  exec node dist/index.js
fi
