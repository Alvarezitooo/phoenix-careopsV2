# ADR-001 : Stratégie Backend - Architecture Hybride TypeScript + Python

**Date** : 2025-10-01
**Statut** : ✅ ACCEPTÉ
**Décideurs** : Lead Architect (Kevin), Product Owner
**Contexte** : Sprint 0 - BLOC 2 (Architecture Decision)

---

## 📋 Contexte

PhoenixCare possède actuellement **2 backends distincts** :

### 🟦 Backend TypeScript (`server/src/`)
- **Port** : 3080 (production) / 3000 (dev)
- **Framework** : Express.js + Next.js SSR
- **Rôle actuel** :
  - Authentification (Supabase)
  - API REST métier (`/api/aides`, `/api/documents`, `/api/procedures`)
  - Orchestration des requêtes
  - Server-Side Rendering Next.js
- **Fichiers** : 23 fichiers TypeScript
- **Dépendances** : Express, Supabase, Zod, Winston, Helmet

### 🐍 Backend Python (`server/simple_rag_server.py`)
- **Port** : 8000
- **Framework** : Flask + Google Gemini AI
- **Rôle actuel** :
  - Système RAG (Retrieval Augmented Generation)
  - Génération de réponses IA empathiques
  - Analyse de documents (PDF, images via Vision)
  - Base de connaissances (29 documents MDPH/CAF)
  - Cache intelligent in-memory
- **Fichiers** : 24 fichiers Python (dont 14 dans `src/ai/`)
- **Dépendances** : Flask, Gemini AI, FAISS, LangChain

### 🔗 Communication actuelle
```
Client (Next.js) → TypeScript (3080) → Python (8000)
                      ↓
                   Supabase
```

Le backend TypeScript fait office de **proxy/orchestrateur** et appelle le serveur Python pour le RAG :
```typescript
// server/src/api/chat/service.ts:2
const FASTAPI_BASE_URL = process.env.PYTHON_API_URL || 'http://localhost:8000';
```

---

## 🎯 Problème

Cette architecture "schizophrène" pose plusieurs **risques critiques** :

### ❌ Problèmes identifiés

1. **Complexité opérationnelle**
   - 2 serveurs à déployer séparément
   - 2 processus à monitorer
   - 2 systèmes de logs différents
   - Gestion de dépendances double (npm + pip)

2. **Points de défaillance multiples**
   - Si Python crash → chat IA indisponible (service critique)
   - Communication HTTP entre services → latence + risque réseau
   - Pas de circuit breaker ni retry intelligents

3. **Coûts de déploiement**
   - 2 containers à provisionner
   - Bande passante interne consommée
   - Configuration réseau complexe (CORS, ports, DNS interne)

4. **Maintenance difficile**
   - Code dupliqué (validation, logs, erreurs)
   - Synchronisation des schémas de données
   - Debugging cross-service complexe

5. **Scalabilité limitée**
   - Impossible de scaler indépendamment les endpoints
   - Pas de load balancing par feature
   - Goulot d'étranglement sur le proxy TypeScript

---

## 🤔 Options considérées

### Option A : Monolithe TypeScript (tout migrer en TS)
**Avantages** :
- Un seul langage, une seule stack
- Déploiement simplifié
- Debugging unifié

**Inconvénients** :
- ❌ **BLOQUANT** : Écosystème IA TypeScript limité
- Gemini SDK Node.js moins mature que Python
- Pas d'équivalent à LangChain/FAISS en TypeScript
- Réécriture complète du RAG = 3-4 semaines (hors sprint)
- Perte de performance (Python meilleur pour ML/vectoriel)

**Verdict** : ❌ Rejeté (blocage technique majeur)

---

### Option B : Monolithe Python (tout migrer en Python)
**Avantages** :
- Écosystème IA complet (Gemini, FAISS, LangChain)
- Un seul serveur
- Meilleur pour ML/vectoriel

**Inconvénients** :
- ❌ Réécriture complète de l'API REST TypeScript
- Perte de l'intégration Next.js (SSR complexe en Python)
- Supabase SDK Python moins riche que TypeScript
- Pas de Zod (validation Python moins mature)
- Réécriture = 2-3 semaines (hors sprint)

**Verdict** : ❌ Rejeté (perte SSR + réécriture trop longue)

---

### Option C : Microservices complets (découpage par domaine)
**Architecture proposée** :
```
- Service Auth (TypeScript)
- Service Chat/RAG (Python)
- Service Documents (TypeScript)
- Service Procedures (TypeScript)
- API Gateway (Kong/Traefik)
```

**Avantages** :
- Scalabilité indépendante par service
- Isolation des pannes
- Teams autonomes possibles

**Inconvénients** :
- ❌ **Over-engineering** pour une équipe de 1-2 devs
- Infrastructure complexe (Gateway, Service Discovery, Observability)
- Coûts d'infra multipliés
- Debugging distribué = cauchemar
- Temps de setup = 1 semaine complète
- Risque de latence inter-services

**Verdict** : ❌ Rejeté (trop complexe pour la taille du projet)

---

### Option D : ✅ Architecture Hybride avec Microservices Léger (BFF Pattern)

**Architecture recommandée** :
```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js)                     │
│                   localhost:3000                        │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              🟦 BACKEND FOR FRONTEND (BFF)              │
│                    TypeScript Express                   │
│                     Port 3080 (prod)                    │
│                                                         │
│  Responsabilités :                                      │
│  • Authentification (Supabase)                          │
│  • Authorization & Session management                   │
│  • API REST métier (/api/aides, /documents, /procedures)│
│  • Orchestration & composition de données              │
│  • Server-Side Rendering (Next.js)                     │
│  • Rate limiting & CORS                                 │
│  • Logging unifié (Winston)                            │
│  • Error handling standardisé                           │
└─────────────────────────────────────────────────────────┘
            ↓                                 ↓
    ┌───────────────┐              ┌──────────────────┐
    │   Supabase    │              │  🐍 AI Service   │
    │               │              │  Python Flask    │
    │  • Auth       │              │   Port 8000      │
    │  • PostgreSQL │              │                  │
    │  • Storage    │              │  Responsabilités:│
    └───────────────┘              │  • RAG (Gemini)  │
                                   │  • Vectorisation │
                                   │  • Doc Analysis  │
                                   │  • Vision AI     │
                                   │  • Cache smart   │
                                   └──────────────────┘
```

**Avantages** :
- ✅ **Séparation des responsabilités claire**
  - BFF TypeScript : Métier + Auth + Orchestration
  - AI Service Python : IA + ML + Vectoriel
- ✅ **Utilise les forces de chaque langage**
  - TypeScript : API REST, validation Zod, Supabase, SSR
  - Python : Gemini, FAISS, LangChain, ML
- ✅ **Scalabilité ciblée**
  - Scaler AI Service séparément (goulet IA identifié)
  - BFF reste léger et réactif
- ✅ **Déploiement pragmatique**
  - 2 containers seulement
  - Communication interne (pas CORS public)
  - Monitoring centralisé via BFF
- ✅ **Évolutivité**
  - Facile d'extraire d'autres services plus tard
  - Pattern BFF permet composition flexible
- ✅ **Pas de réécriture**
  - Architecture actuelle déjà proche de ce pattern
  - Refactoring léger suffisant

**Inconvénients mineurs** :
- ⚠️ 2 serveurs à déployer (acceptable)
- ⚠️ Communication HTTP interne (latence <5ms en local network)

**Verdict** : ✅ **ACCEPTÉ**

---

## 📐 Décision

**Nous adoptons l'Architecture Hybride avec BFF Pattern (Option D)** pour les raisons suivantes :

### 🎯 Justifications techniques

1. **Pragmatisme**
   - Architecture actuelle déjà proche de ce pattern
   - Refactoring léger suffisant (pas de réécriture complète)
   - Livrable dans Sprint 0 (quelques heures)

2. **Séparation des préoccupations**
   - BFF TypeScript : Porte d'entrée unique, sécurité, orchestration
   - AI Service Python : Spécialisé IA/ML (core business)

3. **Performance**
   - TypeScript excellent pour I/O (API REST, Supabase)
   - Python optimal pour calculs vectoriels (FAISS, embeddings)

4. **Maintenabilité**
   - 2 services clairement définis
   - Contrats d'API explicites entre BFF et AI Service
   - Logs centralisés via BFF

5. **Scalabilité future**
   - AI Service peut être scaler indépendamment (cache Redis futur)
   - BFF reste stable et réactif
   - Pattern extensible vers plus de microservices si besoin

---

## 🚀 Plan d'implémentation

### Phase 1 : Refactoring actuel (Sprint 0)
- [x] Renommer `server.ts` → `bff.ts` (clarté)
- [x] Ajouter commentaires architecture dans les 2 serveurs
- [x] Documenter les contrats d'API (BFF ↔ AI Service)
- [x] Standardiser les env vars (PYTHON_API_URL)
- [x] Ajouter retry logic sur appels AI Service (circuit breaker simple)

### Phase 2 : Amélioration monitoring (Sprint 1)
- [ ] Logs structurés JSON uniformes
- [ ] Health checks détaillés (/healthz avec dépendances)
- [ ] Métriques Prometheus (latence, erreurs, cache hit rate)
- [ ] Alerting basique (si AI Service down)

### Phase 3 : Optimisation communication (Sprint 2)
- [ ] Communication gRPC (au lieu de HTTP/JSON)
- [ ] Cache partagé Redis entre BFF et AI Service
- [ ] Load balancing AI Service (si besoin scale)

---

## 🔒 Contrats d'API

### BFF → AI Service

**Endpoint** : `POST http://localhost:8000/api/chat/send`

**Request** :
```json
{
  "message": "Bonjour, je voudrais des infos sur l'AEEH",
  "user_id": "uuid",
  "conversation_history": [],
  "user_context": {}
}
```

**Response** :
```json
{
  "answer": "L'AEEH (Allocation d'Éducation de l'Enfant Handicapé)...",
  "conversation_id": "conv_uuid_timestamp",
  "processing_time": 1.23,
  "sources": [
    { "title": "AEEH - CAF", "url": "..." }
  ]
}
```

**SLA** :
- Timeout : 30 secondes
- Retry : 2 tentatives avec backoff exponentiel
- Fallback : Message d'erreur empathique si échec

---

## 📊 Métriques de succès

| Métrique | Objectif Sprint 0 | Objectif Sprint 2 |
|----------|-------------------|-------------------|
| Latence BFF→AI | < 50ms | < 20ms |
| Latence AI (génération) | < 3s | < 2s |
| Disponibilité AI Service | 99% | 99.9% |
| Cache hit rate | 30% | 60% |
| Temps déploiement | < 5min | < 2min |

---

## 🔄 Revue future

**Date de revue** : Sprint 2 (fin octobre 2025)

**Critères de réussite** :
- [ ] 0 incidents liés à la communication BFF↔AI
- [ ] Latence P95 < 3 secondes end-to-end
- [ ] Cache hit rate > 40%
- [ ] Déploiement automatisé (CI/CD)

**Critères de réévaluation** :
- Si cache hit < 20% → considérer cache Redis partagé
- Si latence P95 > 5s → profiler et optimiser AI Service
- Si incidents communication > 5/mois → considérer gRPC ou message queue

---

## 📚 Références

- [Backend for Frontend Pattern (Sam Newman)](https://samnewman.io/patterns/architectural/bff/)
- [Microservices vs Monoliths (Martin Fowler)](https://martinfowler.com/articles/microservices.html)
- [Python for ML, TypeScript for APIs (Stack Overflow Survey 2024)](https://survey.stackoverflow.co/)

---

**Signé** : Lead Architect (Kevin) & Product Owner
**Date** : 2025-10-01
