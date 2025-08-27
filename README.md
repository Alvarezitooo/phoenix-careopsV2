# 🕊️ PhoenixCare - Architecture Monolitique

> **Mission** : Construire les outils numériques que l'État ne fournit pas
>
> **Philosophie** : "Ce n'est pas du code, c'est de la compassion compilée"

Plateforme d'assistance numérique pour parents d'enfants en situation de handicap.

## 🏗️ Architecture

```
phoenix-care/
├── 📁 server/           # Backend Node.js/Express
├── 📁 client/           # Frontend Next.js/React
├── 🐳 Dockerfile        # Image monolitique pour Railway
├── 📄 docker-compose.yml # Développement local
├── 📄 package.json      # Scripts de gestion
└── 📄 README.md         # Cette documentation
```

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

### Configuration

1. **Repository** : `https://github.com/Alvarezitooo/phoenix-careopsV2.git`
2. **Root Directory** : `phoenix-care`
3. **Build Settings** :
   - Builder: `Dockerfile`
   - Dockerfile Path: `./Dockerfile`

### Variables d'Environnement

```bash
# Configuration Générale
NODE_ENV=production
PORT=<railway-port-dynamic>

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_KEY=votre-anon-key

# Sécurité JWT
JWT_SECRET=IFoxGXy2KfYMNHb5U04QXZ7kT7SOJhtLWfBTUPWQs1Q=
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
