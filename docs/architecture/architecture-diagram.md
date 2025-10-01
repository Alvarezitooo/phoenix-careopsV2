# 🏗️ PhoenixCare - Architecture Système

**Date** : 2025-10-01
**Version** : 1.0 (Architecture Hybride BFF)

---

## 📐 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           🌐 NAVIGATEUR                                 │
│                    (http://localhost:3000)                              │
│                                                                         │
│  Pages:                                                                 │
│  • /              → Landing page                                        │
│  • /login         → Authentification                                    │
│  • /chat          → Interface conversationnelle IA                      │
│  • /dashboard     → Tableau de bord utilisateur                         │
│  • /documents     → Gestion documents                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                          HTTP/HTTPS (JSON)
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    🟦 BACKEND FOR FRONTEND (BFF)                        │
│                         TypeScript + Express                            │
│                        Port: 3080 (prod) / 3000 (dev)                   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                      🔒 COUCHE SÉCURITÉ                            │ │
│  │  • CORS (origines autorisées)                                     │ │
│  │  • Helmet (HTTP headers sécurisés)                                │ │
│  │  • Rate limiting (200 req/15min)                                  │ │
│  │  • Cookie Parser                                                  │ │
│  │  • Auth Middleware (Supabase JWT)                                 │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    📍 ROUTES PUBLIQUES                             │ │
│  │  GET  /healthz       → Health check                               │ │
│  │  GET  /readyz        → Readiness check                            │ │
│  │  POST /api/auth/login    → Login                                  │ │
│  │  POST /api/auth/signup   → Signup                                 │ │
│  │  POST /api/auth/logout   → Logout                                 │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                   🔐 ROUTES PROTÉGÉES                              │ │
│  │                                                                    │ │
│  │  💬 CHAT IA                                                        │ │
│  │  POST   /api/chat/message           → Envoyer message IA         │ │
│  │  GET    /api/chat/history           → Historique conversation    │ │
│  │  POST   /api/chat/analyze-document  → Analyser document          │ │
│  │  DELETE /api/chat/reset             → Reset conversation         │ │
│  │                                                                    │ │
│  │  📄 DOCUMENTS                                                      │ │
│  │  GET    /api/documents              → Liste documents user       │ │
│  │  POST   /api/documents              → Upload document            │ │
│  │  DELETE /api/documents/:id          → Supprimer document         │ │
│  │                                                                    │ │
│  │  📋 PROCÉDURES                                                     │ │
│  │  GET    /api/procedures             → Liste procédures user      │ │
│  │  POST   /api/procedures             → Créer procédure            │ │
│  │  PATCH  /api/procedures/:id         → Mettre à jour procédure    │ │
│  │                                                                    │ │
│  │  🎯 AIDES                                                          │ │
│  │  GET    /api/aides                  → Rechercher aides MDPH/CAF  │ │
│  │  GET    /api/aides/:id              → Détails aide               │ │
│  │                                                                    │ │
│  │  📊 DASHBOARD                                                      │ │
│  │  GET    /api/dashboard/stats        → Statistiques utilisateur   │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                   🎨 NEXT.JS SSR                                   │ │
│  │  • Server-Side Rendering pages                                    │ │
│  │  • Static file serving                                            │ │
│  │  • API routes Next.js                                             │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  Technologies:                                                          │
│  • Express.js (API REST)                                                │
│  • Next.js 14 (SSR)                                                     │
│  • Zod (validation)                                                     │
│  • Winston (logs)                                                       │
│  • Supabase SDK (auth + DB)                                             │
└─────────────────────────────────────────────────────────────────────────┘
           ↓                                    ↓
    HTTP (JSON)                        HTTP (JSON)
           ↓                                    ↓
┌──────────────────────┐        ┌────────────────────────────────────────┐
│    📦 SUPABASE       │        │      🐍 AI SERVICE                     │
│   (Backend as a      │        │      Python + Flask                    │
│     Service)         │        │      Port: 8000                        │
│                      │        │                                        │
│  🔐 Auth             │        │  ┌──────────────────────────────────┐ │
│  • JWT tokens        │        │  │     🤖 GEMINI AI ENGINE          │ │
│  • User sessions     │        │  │  • google.generativeai           │ │
│  • Row-level security│        │  │  • Model: gemini-2.5-flash       │ │
│                      │        │  │  • Context: empathique MDPH      │ │
│  🗄️ PostgreSQL       │        │  │  • Safety: HARM_BLOCK_MEDIUM     │ │
│  • users             │        │  └──────────────────────────────────┘ │
│  • conversations     │        │                                        │
│  • messages (JSONB)  │        │  ┌──────────────────────────────────┐ │
│  • user_memories     │        │  │     📚 RAG SYSTEM                │ │
│  • documents         │        │  │  • Knowledge base: 29 docs       │ │
│  • procedures        │        │  │  • Vectorization: FAISS          │ │
│                      │        │  │  • Embedding: Gemini Embedding   │ │
│  📁 Storage          │        │  │  • Similarity search             │ │
│  • User documents    │        │  └──────────────────────────────────┘ │
│  • PDF, images       │        │                                        │
│                      │        │  ┌──────────────────────────────────┐ │
│  🔗 Realtime         │        │  │     💾 SMART CACHE               │ │
│  • Presence          │        │  │  • In-memory OrderedDict         │ │
│  • Live updates      │        │  │  • TTL: 24h                      │ │
│                      │        │  │  • Max size: 1000 entries        │ │
│                      │        │  │  • Hit rate: ~40%                │ │
│                      │        │  └──────────────────────────────────┘ │
│                      │        │                                        │
│  URL: Supabase Cloud │        │  ┌──────────────────────────────────┐ │
│                      │        │  │     🔍 DOCUMENT ANALYSIS         │ │
│                      │        │  │  • Gemini Vision (images)        │ │
│                      │        │  │  • PDF parsing (PyPDF2)          │ │
│                      │        │  │  • OCR capability                │ │
│                      │        │  │  • Structured extraction         │ │
│                      │        │  └──────────────────────────────────┘ │
│                      │        │                                        │
│                      │        │  Routes:                               │
│                      │        │  POST /api/chat/send                   │
│                      │        │  POST /api/chat/analyze                │
│                      │        │  GET  /api/chat/stats                  │
│                      │        │                                        │
│                      │        │  Technologies:                         │
│                      │        │  • Flask (API REST)                    │
│                      │        │  • Flask-CORS                          │
│                      │        │  • google-generativeai                 │
│                      │        │  • FAISS (vectorization)               │
│                      │        │  • python-dotenv                       │
└──────────────────────┘        └────────────────────────────────────────┘
```

---

## 🔄 Flux de données principaux

### 1. Authentification utilisateur

```
User → BFF (/api/auth/login)
         ↓
      Supabase Auth (JWT)
         ↓
      BFF (set cookie)
         ↓
      User (authenticated)
```

### 2. Chat IA avec RAG

```
User (message)
    ↓
BFF (/api/chat/message) [auth middleware]
    ↓
Supabase (save message)
    ↓
AI Service (/api/chat/send)
    ↓
┌─────────────────────────────────┐
│  1. Normalize query             │
│  2. Check cache (SHA256 hash)   │
│  3. If miss:                    │
│     a. Vectorize query (Gemini) │
│     b. Search knowledge base    │
│     c. Generate response (RAG)  │
│     d. Cache result             │
│  4. Return answer + sources     │
└─────────────────────────────────┘
    ↓
BFF (format response)
    ↓
Supabase (save AI response)
    ↓
User (display answer)
```

### 3. Document analysis

```
User (upload PDF/image)
    ↓
BFF (/api/chat/analyze-document)
    ↓
Supabase Storage (save file)
    ↓
AI Service (/api/chat/analyze)
    ↓
┌─────────────────────────────────┐
│  1. Decode base64 content       │
│  2. Gemini Vision API           │
│  3. Extract structured data:    │
│     • Dates                     │
│     • Montants                  │
│     • Références                │
│     • Decisions                 │
│  4. Generate suggestions        │
└─────────────────────────────────┘
    ↓
BFF (format analysis)
    ↓
Supabase (save metadata)
    ↓
User (display analysis)
```

---

## 🔐 Sécurité

### Couche 1 : BFF (Frontend Protection)
- ✅ CORS (origines autorisées uniquement)
- ✅ Helmet (CSP, XSS protection)
- ✅ Rate limiting (200 req/15min par IP)
- ✅ Cookie httpOnly + secure
- ✅ JWT validation (Supabase)

### Couche 2 : Supabase (Data Protection)
- ✅ Row-Level Security (RLS)
- ✅ JWT expiration (1h)
- ✅ Refresh token rotation
- ✅ Encrypted at rest
- ✅ SSL/TLS en transit

### Couche 3 : AI Service (Internal)
- ✅ Pas d'exposition publique (localhost:8000)
- ✅ Communication interne uniquement (BFF)
- ✅ Sanitization des inputs (XSS prevention)
- ✅ Gemini safety settings (HARM_BLOCK_MEDIUM)
- ✅ Cache SHA256 (no MD5)

---

## 📊 Monitoring & Observabilité

### Logs (Winston)
```
BFF:
  • request.log  → Toutes les requêtes HTTP
  • error.log    → Erreurs applicatives
  • system.log   → Événements système

AI Service:
  • console logs → Stdout (captured by Docker)
  • Cache stats  → Hit/miss rate
  • Gemini calls → Latency & tokens
```

### Health Checks
```
BFF:
  GET /healthz  → { status: "ok" }
  GET /readyz   → { status: "ready", dependencies: [...] }

AI Service:
  GET /health   → { status: "ok", cache_hit_rate: 0.42 }
```

### Métriques clés
- Latence end-to-end (P50, P95, P99)
- Taux d'erreur BFF ↔ AI Service
- Cache hit rate (objectif: >40%)
- Tokens Gemini consommés
- Temps de génération IA

---

## 🚀 Déploiement

### Environnements

```
Development:
  • BFF: localhost:3000 (npm run dev)
  • AI:  localhost:8000 (python3 simple_rag_server.py)
  • DB:  Supabase Cloud (dev project)

Production (Railway):
  • BFF: phoenixcare.railway.app
  • AI:  phoenixcare-ai.railway.app
  • DB:  Supabase Cloud (prod project)
```

### Docker Compose
```yaml
services:
  bff:
    build: ./server
    ports:
      - "3080:3080"
    environment:
      - NODE_ENV=production
      - PYTHON_API_URL=http://ai-service:8000

  ai-service:
    build: ./server
    command: python3 simple_rag_server.py
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
```

---

## 🔮 Évolutions futures

### Sprint 1
- [ ] Circuit breaker sur BFF → AI Service
- [ ] Retry avec backoff exponentiel
- [ ] Logs structurés JSON uniformes

### Sprint 2
- [ ] Cache Redis partagé (remplacer in-memory)
- [ ] Métriques Prometheus + Grafana
- [ ] Alerting (PagerDuty)

### Sprint 3+
- [ ] gRPC au lieu de HTTP (performance)
- [ ] Load balancing AI Service (si scale)
- [ ] Service Discovery (Consul/Eureka)

---

**Maintenu par** : Lead Architect (Kevin)
**Dernière mise à jour** : 2025-10-01
