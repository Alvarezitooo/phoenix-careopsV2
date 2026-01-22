# 🚀 Guide de Déploiement Railway - PhoenixCare

> **Architecture** : 2 services Railway séparés (Backend Python + Frontend Next.js)

## 📋 Prérequis

- [ ] Compte Railway ([railway.app](https://railway.app))
- [ ] Repository GitHub avec le code PhoenixCare
- [ ] Projet Supabase configuré ([supabase.com](https://supabase.com))
- [ ] Clé API Gemini ([ai.google.dev](https://ai.google.dev))

---

## 🎯 Architecture Déploiement

```
┌─────────────────────────────────────────────────────┐
│                  RAILWAY PROJECT                    │
│                                                     │
│  ┌──────────────────┐      ┌──────────────────┐   │
│  │   SERVICE 1      │      │   SERVICE 2      │   │
│  │   BACKEND        │◄─────┤   FRONTEND       │   │
│  │   (Python/       │      │   (Next.js)      │   │
│  │    FastAPI)      │      │                  │   │
│  │   Port: 8080     │      │   Port: 3000     │   │
│  └──────────────────┘      └──────────────────┘   │
│         ▲                          ▲               │
│         │                          │               │
└─────────┼──────────────────────────┼───────────────┘
          │                          │
          └──────── SUPABASE ────────┘
```

---

## 📦 ÉTAPE 1 : Déployer le Backend (Python/FastAPI)

### 1.1 Créer le projet Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"New Project"**
3. Sélectionnez **"Deploy from GitHub repo"**
4. Choisissez votre repository `phoenix-careopsV2`
5. Nommez le projet : `phoenixcare-backend`

### 1.2 Configurer le service Backend

**Settings → Service:**
- **Service Name:** `backend`
- **Root Directory:** `/` (racine du projet)
- **Dockerfile Path:** `./Dockerfile`

**Settings → Networking:**
- Activez **"Generate Domain"** pour obtenir une URL publique
- Notez l'URL générée (ex: `https://backend-production-xxxx.up.railway.app`)

### 1.3 Variables d'environnement Backend

Allez dans **Variables** et ajoutez :

```bash
# ============================================
# 🔥 CONFIGURATION GÉNÉRALE
# ============================================
NODE_ENV=production
PORT=8080

# ============================================
# 🗄️ SUPABASE DATABASE
# ============================================
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=votre-service-role-key-ultra-secrete

# ============================================
# 🤖 GEMINI AI
# ============================================
GEMINI_API_KEY=votre-cle-gemini-api

# ============================================
# 🔐 JWT & SÉCURITÉ
# ============================================
# ⚠️ CLÉ GÉNÉRÉE POUR VOUS (CHANGEZ-LA!)
JWT_SECRET=eFtzXkV5wnG7Tk3j0wkjAgX7JZDrbctJgs+Y9AZJuWY=

# ============================================
# 📊 REDIS CACHE (Optionnel)
# ============================================
# Si vous utilisez Redis, activez Redis sur Railway:
# Dans votre projet → Add Service → Redis
# Railway générera automatiquement REDIS_URL
REDIS_URL=${REDIS_URL}

# ============================================
# 🌐 CORS & ORIGINS
# ============================================
# Sera rempli après déploiement du frontend
# Format: https://votre-frontend.up.railway.app
ALLOWED_ORIGINS=https://your-frontend-domain.up.railway.app

# ============================================
# 📝 LOGS & MONITORING
# ============================================
LOG_LEVEL=info
```

### 1.4 Ajouter Redis (Optionnel mais recommandé)

1. Dans votre projet Railway, cliquez sur **"+ New"**
2. Sélectionnez **"Database" → "Redis"**
3. Railway créera automatiquement la variable `REDIS_URL`
4. Elle sera accessible automatiquement par votre backend

### 1.5 Déployer le Backend

1. Railway détecte automatiquement les changements
2. Le build démarre automatiquement
3. Attendez que le déploiement soit **"Active"** (voyant vert)
4. Testez avec : `curl https://votre-backend.up.railway.app/health`

---

## 🎨 ÉTAPE 2 : Déployer le Frontend (Next.js)

### 2.1 Créer le service Frontend

Dans le **même projet Railway** :

1. Cliquez sur **"+ New"** → **"GitHub Repo"**
2. Sélectionnez à nouveau votre repository
3. Nommez le service : `frontend`

### 2.2 Configurer le service Frontend

**Settings → Service:**
- **Service Name:** `frontend`
- **Root Directory:** `/client` ⚠️ **Important!**
- **Dockerfile Path:** `./Dockerfile`

**Settings → Networking:**
- Activez **"Generate Domain"**
- Notez l'URL générée (ex: `https://frontend-production-yyyy.up.railway.app`)

### 2.3 Variables d'environnement Frontend

⚠️ **Important** : Les variables `NEXT_PUBLIC_*` doivent être définies **au build time** ET **au runtime**

Allez dans **Variables** et ajoutez :

```bash
# ============================================
# 🌐 API BACKEND
# ============================================
# Remplacez par l'URL de votre backend Railway
NEXT_PUBLIC_API_URL=https://votre-backend.up.railway.app

# ============================================
# 🗄️ SUPABASE (Variables publiques)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-supabase-anon-key

# ============================================
# 🏠 APPLICATION URL
# ============================================
# Remplacez par l'URL de votre frontend Railway
NEXT_PUBLIC_APP_URL=https://votre-frontend.up.railway.app

# ============================================
# 🔧 CONFIGURATION NODE
# ============================================
NODE_ENV=production
PORT=3000
```

### 2.4 Déployer le Frontend

1. Railway build le frontend automatiquement
2. Attendez que le déploiement soit **"Active"**
3. Testez en ouvrant l'URL du frontend dans votre navigateur

---

## 🔗 ÉTAPE 3 : Connecter Backend et Frontend

### 3.1 Mettre à jour le CORS du Backend

Retournez dans les **variables du Backend** et mettez à jour :

```bash
ALLOWED_ORIGINS=https://votre-frontend.up.railway.app
```

Railway redéploiera automatiquement le backend.

### 3.2 Vérifier la connexion

1. Ouvrez votre frontend : `https://votre-frontend.up.railway.app`
2. Ouvrez la console développeur (F12)
3. Testez l'envoi d'un message dans le chat
4. Vérifiez qu'il n'y a pas d'erreurs CORS

---

## ✅ ÉTAPE 4 : Tests Post-Déploiement

### 4.1 Health Checks Backend

```bash
# Test de santé
curl https://votre-backend.up.railway.app/health

# Test de l'API chat
curl -X POST https://votre-backend.up.railway.app/api/chat/send \
  -H "Content-Type: application/json" \
  -d '{"message":"Bonjour", "user_id":"test"}'
```

### 4.2 Tests Frontend

- [ ] Page d'accueil charge correctement
- [ ] Authentification Supabase fonctionne
- [ ] Chat envoie des messages au backend
- [ ] Pas d'erreurs dans la console

---

## 🔧 ÉTAPE 5 : Configuration Avancée (Optionnel)

### 5.1 Custom Domain

**Backend:**
1. Settings → Networking → Custom Domain
2. Ajoutez : `api.votredomaine.com`
3. Configurez le CNAME chez votre registrar

**Frontend:**
1. Settings → Networking → Custom Domain
2. Ajoutez : `app.votredomaine.com` ou `votredomaine.com`
3. Configurez le CNAME chez votre registrar

### 5.2 Scaling

**Backend:**
- Settings → Resources → Vertical Scaling
- Recommandé : 2GB RAM, 2 vCPU

**Frontend:**
- Settings → Resources → Vertical Scaling
- Recommandé : 1GB RAM, 1 vCPU

### 5.3 Monitoring

1. Railway → Metrics (onglet)
2. Surveillez :
   - CPU Usage
   - Memory Usage
   - Network I/O
   - Request Count

---

## 🐛 Troubleshooting

### Erreur : "Service failed to start"

**Backend:**
```bash
# Vérifiez les logs Railway
# Dans Railway → Service → Logs

# Vérifiez que toutes les variables sont définies
# Settings → Variables

# Vérifiez que le Dockerfile est à la racine
```

**Frontend:**
```bash
# Vérifiez que Root Directory = /client
# Vérifiez que toutes les variables NEXT_PUBLIC_* sont définies
# Vérifiez que output: 'standalone' est dans next.config.mjs
```

### Erreur CORS

```bash
# Backend → Variables
ALLOWED_ORIGINS=https://votre-frontend-exact.up.railway.app

# Pas d'espace, pas de virgule finale
# Redémarrez le backend après modification
```

### Erreur "Cannot connect to API"

```bash
# Frontend → Variables
# Vérifiez que NEXT_PUBLIC_API_URL pointe vers le backend
NEXT_PUBLIC_API_URL=https://votre-backend-exact.up.railway.app

# Pas de slash final !
```

### Build Frontend échoue

```bash
# Vérifiez que le Dockerfile frontend existe bien dans /client
ls -la client/Dockerfile

# Vérifiez que next.config.mjs a output: 'standalone'
cat client/next.config.mjs | grep standalone
```

---

## 📊 Résumé des URLs

Après déploiement, vous aurez :

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | `https://backend-production-xxxx.up.railway.app` | API FastAPI |
| **Frontend Web** | `https://frontend-production-yyyy.up.railway.app` | Application Next.js |
| **Health Backend** | `https://backend-production-xxxx.up.railway.app/health` | Status API |
| **Docs API** | `https://backend-production-xxxx.up.railway.app/docs` | Swagger UI |

---

## 💰 Coûts Estimés

Railway offre **$5 de crédit gratuit/mois**.

**Estimation mensuelle** (avec petit trafic) :
- Backend (2GB RAM, 2 vCPU) : ~$10-15/mois
- Frontend (1GB RAM, 1 vCPU) : ~$5-10/mois
- Redis (optionnel) : ~$5/mois
- **Total** : ~$20-30/mois

---

## 🆘 Support

- **Railway Docs** : [docs.railway.app](https://docs.railway.app)
- **Railway Discord** : [discord.gg/railway](https://discord.gg/railway)
- **Issues GitHub** : [github.com/Alvarezitooo/phoenix-careopsV2/issues](https://github.com/Alvarezitooo/phoenix-careopsV2/issues)

---

**Fait avec 💜 pour les familles qui en ont besoin**

🕊️ PhoenixCare Team
