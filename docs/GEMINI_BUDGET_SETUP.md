# 💰 Configuration Budget Gemini API

## ⚠️ CRITIQUE : Protéger contre explosion des coûts

Pour une béta avec 1000 utilisateurs, l'API Gemini peut coûter cher sans limite.

---

## 🔧 Étapes de configuration (5 min)

### 1. Aller sur Google Cloud Console
👉 https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com

### 2. Activer Budget Alerts

1. Menu "Billing" → "Budgets & alerts"
2. Click "CREATE BUDGET"
3. Configurer :
   - **Name**: `Phoenix Gemini Budget`
   - **Projects**: Sélectionner ton projet
   - **Services**: Sélectionner `Generative Language API`
   - **Budget amount**: `100 EUR/month` (recommandé pour béta)

### 3. Configurer Alertes

**Alertes recommandées** :
- ⚠️ 50% du budget → Email notification
- 🚨 90% du budget → Email + Slack
- 🛑 100% du budget → **DÉSACTIVER L'API automatiquement**

### 4. Activer la désactivation automatique

**Cloud Function pour désactiver l'API** :
```javascript
// Exemple de fonction pour désactiver l'API à 100% budget
exports.disableGeminiApi = async (pubsubMessage) => {
  const budgetAmount = JSON.parse(
    Buffer.from(pubsubMessage.data, 'base64').toString()
  );

  if (budgetAmount.costAmount >= budgetAmount.budgetAmount) {
    // Désactiver l'API
    await serviceusage.services.disable({
      name: 'projects/YOUR_PROJECT/services/generativelanguage.googleapis.com'
    });

    console.log('🛑 Gemini API DISABLED - Budget exceeded');
  }
};
```

---

## 📊 Estimation coûts Gemini Flash 2.5

**Tarifs actuels** :
- Input: $0.075 / 1M tokens (~$0.000075 / 1K tokens)
- Output: $0.30 / 1M tokens (~$0.0003 / 1K tokens)

**Estimation par requête** :
- Prompt moyen : 500 tokens input + 400 tokens output
- Coût : ~$0.00015 par requête

**Pour 1000 utilisateurs actifs** :
- 10 requêtes/user/jour → 10,000 requêtes/jour
- Coût/jour : ~$1.50
- **Coût/mois : ~$45** ✅

Budget **100€/mois** = Confortable pour 1000 users

---

## 🔍 Monitoring en temps réel

### Dashboards recommandés :
1. **Google Cloud Console** → API & Services → Quotas
2. **Logs** : Requests par user_id (vérifier abus)
3. **Alerting** : Spike anormal de requêtes

### Alertes Slack (optionnel) :
```python
# Ajouter dans simple_rag_server.py
import requests

def notify_high_usage(cost_today):
    if cost_today > 5:  # $5/jour = Alerte
        requests.post(SLACK_WEBHOOK, json={
            "text": f"🚨 Gemini API : ${cost_today} dépensés aujourd'hui !"
        })
```

---

## ✅ CHECKLIST AVANT BÉTA

- [ ] Budget configuré (100€/mois)
- [ ] Alertes 50% / 90% / 100%
- [ ] Désactivation automatique à 100%
- [ ] Monitoring dashboard configuré
- [ ] Slack notifications (optionnel)

---

**Date setup** : _____________
**Budget configuré** : ________€
**Alertes configurées** : ☐ Oui ☐ Non
