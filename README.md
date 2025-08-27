# 🕊️ PhoenixCare - Architecture Monolitique Optimisée

> **Mission** : Construire les outils numériques que l'État ne fournit pas
>
> **Philosophie** : "Ce n'est pas du code, c'est de la compassion compilée"

Plateforme d'assistance numérique pour parents d'enfants en situation de handicap.

## 🏗️ Architecture Clarifiée

### 🔥 SOLUTION RECOMMANDÉE : Custom Next Server + Express
- ✅ **1 seul processus Node.js** - Plus de conflit, plus de zombie process
- ✅ **1 seul port Railway** - Architecture véritablement monolitique
- ✅ **0 proxy, 0 complexité** - Express gère les API, Next.js gère les pages/assets
- ✅ **Sécurité renforcée** - Helmet, Rate Limiting, CORS sécurisé, Cookies JWT

```
phoenix-careops/
├── 📁 server/              # Backend Node.js/Express (avec Next.js intégré)
├── 📁 client/              # Frontend Next.js/React (build uniquement)
├── 🐳 Dockerfile           # Multi-stage optimisé avec tini & health checks
├── 📄 start.sh             # Script de démarrage avec gestion des signaux
├── 📄 env-template.txt     # Template des variables d'environnement
├── 📄 package.json         # Scripts de gestion unifiés
└── 📄 README.md            # Cette documentation
```

### 🔄 Flux d'Exécution
1. **Railway** démarre le container avec `./start.sh`
2. **start.sh** configure les variables et gère les signaux UNIX
3. **Express** démarre et prépare **Next.js**
4. **Express** gère les routes `/api/*`
5. **Next.js** gère toutes les autres routes (pages, assets, etc.)
6. **Un seul port**, **un seul processus** = **PERFECT !**

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- Docker (optionnel pour le développement local)

### Installation

```bash
# Cloner le repository
git clone https://github.com/Alvarezitooo/phoenix-careopsV2.git
cd phoenix-careopsV2/phoenix-care

# Installer toutes les dépendances
npm run install:all
```

### Développement Local

```bash
# Démarrer les deux applications en parallèle
npm run dev

# Ou démarrer séparément :
npm run dev:server  # Backend sur http://localhost:4000
npm run dev:client  # Frontend sur http://localhost:3000
```

### Avec Docker (Développement)

```bash
# Construire et démarrer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

## 🚀 Déploiement sur Railway

### ⚡ Configuration Optimisée

#### Repository & Build
1. **Repository** : `https://github.com/Alvarezitooo/phoenix-careopsV2.git`
2. **Root Directory** : `/` (racine du repository)
3. **Build Settings** :
   - Builder: `Dockerfile`
   - Dockerfile Path: `./Dockerfile`

#### Architecture Déploiement
- ✅ **1 seul service Railway** (pas besoin de 2 services !)
- ✅ **1 seul container Docker** avec Backend + Frontend
- ✅ **1 seul port dynamique** attribué par Railway
- ✅ **Health checks intégrés** (`/healthz`, `/readyz`)
- ✅ **Gestion des signaux** avec tini (PID 1 propre)

### 🔧 Variables d'Environnement Requises

```bash
# =============================================================================
# 🔥 SÉCURITÉ CRITIQUE - Variables Requises
# =============================================================================

# Configuration Générale
NODE_ENV=production
PORT=<railway-port-dynamic>  # Automatique - NE PAS MODIFIER

# 🔥 CLÉ JWT - GÉNÉREZ UNE NOUVELLE POUR LA PRODUCTION !
# Commande pour générer: openssl rand -base64 32
JWT_SECRET=votre-cle-jwt-unique-super-secrete-32-caracteres-minimum

# =============================================================================
# 🗄️ SUPABASE - Base de Données
# =============================================================================

# URL de votre projet Supabase (publique - visible dans les settings Supabase)
SUPABASE_URL=https://votre-projet-id.supabase.co

# 🔥 ANON KEY (PUBLIQUE) - Utilisée côté client
# Cette clé est PUBLIQUE et peut être exposée dans le frontend
SUPABASE_KEY=votre-supabase-anon-key-publique

# ⚠️ SERVICE ROLE KEY (ULTRA SECRÈTE) - Côté serveur uniquement
# Cette clé permet TOUTES les opérations sur la DB
# À récupérer dans Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ultra-secrete

# =============================================================================
# 🌐 CONFIGURATION SÉCURITÉ
# =============================================================================

# Origines autorisées pour CORS (séparées par des virgules)
# Exemples: https://votredomaine.com, https://www.votredomaine.com
ALLOWED_ORIGINS=https://votredomaine.com

# Niveau de logs (debug, info, warn, error)
LOG_LEVEL=info
```

### 🔑 Génération de Clés Sécurisées

#### Générer une clé JWT
```bash
# Méthode 1: OpenSSL (recommandé)
openssl rand -base64 32

# Méthode 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Méthode 3: Générateur en ligne (pour développement uniquement)
# https://supabase.com/docs/guides/auth
```

#### Récupérer les clés Supabase
1. **Allez sur** [Supabase Dashboard](https://supabase.com/dashboard)
2. **Sélectionnez votre projet**
3. **Settings** > **API**
4. **Copiez** :
   - `Project URL` → `SUPABASE_URL`
   - `anon public` → `SUPABASE_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 🚨 Points de Vigilance Sécurité

#### ✅ À FAIRE ABSOLUMENT
- [ ] Générer une **nouvelle clé JWT** unique pour la production
- [ ] Utiliser la **service role key** uniquement côté serveur
- [ ] Définir les **origines autorisées** dans `ALLOWED_ORIGINS`
- [ ] Tester les **health checks** après déploiement

#### ⚠️ À VÉRIFIER
- [ ] Clé JWT différente de l'exemple ci-dessus
- [ ] Service role key **jamais exposée** côté client
- [ ] Origines CORS **explicites** et limitées
- [ ] Variables définies **dans Railway** (pas dans le code)

### 🧪 Test Post-Déploiement

Après déploiement, vérifiez :

```bash
# 1. Health checks
curl https://your-app.railway.app/healthz
curl https://your-app.railway.app/readyz

# 2. API principale
curl https://your-app.railway.app/api

# 3. Application frontend
open https://your-app.railway.app
```

### 🔧 Troubleshooting

#### Erreur "Variable requise manquante"
- Vérifiez que toutes les variables sont définies dans Railway
- Redémarrez le service après ajout de variables

#### Erreur CORS
- Vérifiez `ALLOWED_ORIGINS` dans les variables Railway
- Assurez-vous que votre domaine est dans la liste

#### Erreur "Service pas sain"
```bash
# Vérifiez les logs Railway
# Regardez la section "Deploy Logs"
# Vérifiez les variables d'environnement
```

#### Erreur de build
- Vérifiez que le Dockerfile est à la racine
- Assurez-vous que `start.sh` est exécutable
- Vérifiez les dépendances dans `server/package.json`

---

## 🛡️ Sécurité Renforcée

### 🔒 Mesures de Sécurité Implémentées

#### 1️⃣ **Helmet** - Protection des Headers HTTP
- **Content Security Policy (CSP)** : Bloque les attaques XSS et injection de code
- **HSTS** : Force les connexions HTTPS
- **X-Content-Type-Options** : Prévient les attaques MIME sniffing
- **Referrer Policy** : Contrôle les informations de référencement

#### 2️⃣ **Rate Limiting** - Protection contre les attaques DoS
- **Général** : 100 requêtes par IP toutes les 15 minutes
- **Authentification** : 5 tentatives par IP toutes les 15 minutes
- **Health Checks** : Exemptés du rate limiting

#### 3️⃣ **CORS Sécurisé** - Contrôle d'Accès Inter-Origines
- **Origines explicites** : Seules les origines autorisées peuvent accéder
- **Credentials** : Support des cookies d'authentification
- **Gestion d'erreurs** : Messages d'erreur informatifs

#### 4️⃣ **Cookies JWT Sécurisés**
- **HttpOnly** : Protège contre les attaques XSS
- **Secure** : Transmission uniquement en HTTPS
- **SameSite** : Protection CSRF
- **Max-Age** : Expiration automatique des sessions

#### 5️⃣ **Validation des Données**
- **Zod** : Validation stricte des schémas de données
- **Limite de taille** : Body limité à 10MB
- **Sanitisation** : Nettoyage automatique des entrées

### 🚨 Bonnes Pratiques de Sécurité

#### ✅ À FAIRE
- Générer des clés uniques pour chaque environnement
- Utiliser des mots de passe forts (32+ caractères)
- Rotater les clés régulièrement
- Utiliser des variables d'environnement Railway
- Monitorer les logs de sécurité

#### ❌ À ÉVITER
- Hardcoder des clés dans le code
- Partager des clés entre environnements
- Utiliser des valeurs par défaut en production
- Exposer des clés secrètes côté client

## 🏥 Health Checks & Monitoring

### Endpoints Disponibles
- **`/healthz`** - Liveness probe (état de santé générale)
- **`/readyz`** - Readiness probe (prêt à recevoir du trafic)
- **`/api/health`** - Informations détaillées sur l'API

### Métriques Monitorées
- **Uptime** : Temps de fonctionnement du service
- **Mémoire** : Utilisation mémoire (RSS, Heap, etc.)
- **Sécurité** : État des protections (Helmet, Rate Limit, CORS)
- **Dépendances** : État de Next.js et base de données

### Commandes de Diagnostic
```bash
# Test rapide des health checks
./start.sh --health-check

# Vérification manuelle
curl https://your-app.railway.app/healthz
curl https://your-app.railway.app/readyz
```

## 📊 Scripts Disponibles

### Scripts Racine
```bash
npm run install:all     # Installe les dépendances server + client
npm run dev             # Démarrage développement (server + client)
npm run build           # Build production (server + client)
npm run start           # Démarrage production
npm run docker:up       # Démarrage avec Docker Compose
```

### Scripts Server (/server)
```bash
cd server
npm run dev            # Développement avec ts-node-dev
npm run build          # Compilation TypeScript
npm run start          # Démarrage production
```

### Scripts Client (/client)
```bash
cd client
npm run dev            # Développement Next.js
npm run build          # Build Next.js
npm run start          # Démarrage production Next.js
```
```

## 📁 Structure Détaillée

### Server (Backend)
```
server/
├── src/
│   ├── config/          # Configuration Supabase
│   ├── middlewares/     # Authentification JWT
│   ├── routes/          # API endpoints
│   ├── services/        # Logique métier
│   ├── types/           # Types TypeScript
│   ├── utils/           # Utilitaires (privacy, etc.)
│   └── validators/      # Validation Zod
├── package.json
├── tsconfig.json
└── dist/               # Build TypeScript
```

### Client (Frontend)
```
client/
├── app/                # Pages Next.js 13+ (app router)
├── components/         # Composants React
├── lib/                # Utilitaires frontend
├── public/             # Assets statiques
├── types/              # Types TypeScript
├── package.json
├── next.config.mjs
├── tailwind.config.ts
└── postcss.config.js
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev              # Démarre server + client
npm run dev:server       # Backend uniquement
npm run dev:client       # Frontend uniquement

# Build
npm run build           # Build server + client
npm run build:server    # Build backend
npm run build:client    # Build frontend

# Production
npm start               # Démarre server + client

# Docker
npm run docker:build    # Construire l'image
npm run docker:run      # Démarrer le container
npm run docker:up       # Démarrer avec docker-compose
npm run docker:down     # Arrêter docker-compose

# Maintenance
npm run clean           # Nettoyer les builds
npm run install:all     # Réinstaller toutes les dépendances
```

## 🔒 Sécurité

- **Utilisateur non-root** dans Docker
- **JWT sécurisé** avec clé de 256 bits
- **Conformité RGPD** avec anonymisation
- **Variables d'environnement** pour les secrets
- **Health checks** intégrés

## 🎯 Fonctionnalités

- 🏥 **API REST sécurisée** avec Express/TypeScript
- ⚛️ **Interface moderne** avec Next.js/TailwindCSS
- 🗄️ **Base de données** Supabase/PostgreSQL
- 🔐 **Authentification** JWT
- 💬 **Chat empathique** avec IA
- 📋 **Gestion des aides** et démarches administratives
- 🎯 **Accessibilité** WCAG 2.1+
- 📱 **Progressive Web App** (PWA)
- 🌐 **Support multilingue**

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 💝 À propos

Cette plateforme a été conçue avec cœur pour aider les parents d'enfants en situation de handicap. Chaque ligne de code vise à simplifier leur quotidien complexe et souvent invisible.

*"Ce n'est pas du code, c'est de la compassion compilée."*

---

**PhoenixCare Team** 🕊️
