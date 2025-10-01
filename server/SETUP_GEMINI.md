# Configuration Gemini 1.5 Flash pour PhoenixCare

## 🚀 Guide de setup rapide

### 1. Obtenir une clé API Gemini

1. Aller sur [Google AI Studio](https://aistudio.google.com/)
2. Se connecter avec un compte Google
3. Cliquer sur **"Get API Key"**
4. Créer une nouvelle clé API
5. Copier la clé (format: `AIza...`)

### 2. Configuration environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer et ajouter votre clé Gemini
nano .env
```

Dans `.env`, ajouter :
```env
GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
```

### 3. Installation dépendances

```bash
# Installer les dépendances Python
pip install -r requirements.txt

# Ou avec pip3
pip3 install -r requirements.txt
```

### 4. Test de configuration

```python
# test_gemini.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

response = model.generate_content("Bonjour, tu es PhoenixIA ?")
print(response.text)
```

```bash
python test_gemini.py
```

## 💰 Coûts Gemini 1.5 Flash

### Tarification (2024)
- **Input**: $0.075 / 1M tokens
- **Output**: $0.30 / 1M tokens

### Estimation PhoenixCare
```
Scénario: 1000 questions/mois
- Input moyen: 500 tokens/question
- Output moyen: 300 tokens/réponse

Coût mensuel:
- Input: (1000 × 500) / 1M × $0.075 = $0.0375
- Output: (1000 × 300) / 1M × $0.30 = $0.09
TOTAL: ~$0.13/mois pour 1000 questions !
```

## 🔧 Configuration avancée

### Optimisation performance
```python
generation_config = {
    "temperature": 0.3,      # Réponses factuelles
    "top_p": 0.8,           # Diversité contrôlée
    "top_k": 40,            # Limitation vocabulaire
    "max_output_tokens": 1000  # Réponses concises
}
```

### Sécurité
```python
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
```

## 🔍 Debugging

### Erreurs courantes

1. **"API key not valid"**
   ```bash
   # Vérifier la clé
   echo $GEMINI_API_KEY

   # Régénérer sur Google AI Studio
   ```

2. **"Quota exceeded"**
   ```bash
   # Vérifier les quotas sur Google Cloud Console
   # Gemini Flash a des limites généreuses mais vérifier
   ```

3. **"Safety filter triggered"**
   ```python
   # Ajuster les safety_settings si nécessaire
   # Voir configuration avancée ci-dessus
   ```

### Logs de debug
```python
import logging
logging.basicConfig(level=logging.DEBUG)

# Les appels Gemini seront loggés
```

## ✅ Validation setup

### Checklist
- [ ] Clé API Gemini configurée
- [ ] Variables d'environnement chargées
- [ ] Dépendances installées
- [ ] Test de génération réussi
- [ ] Logs sans erreur

### Test intégration PhoenixCare
```bash
# Lancer le serveur de développement
python -m uvicorn main:app --reload --port 8000

# Tester l'endpoint
curl -X POST "http://localhost:8000/api/chat/send" \
  -H "Content-Type: application/json" \
  -d '{"message": "Qu'est-ce que l'AEEH ?"}'
```

## 🎯 Avantages Gemini pour PhoenixCare

### ✅ Points forts
- **Prix ultra-compétitif** (~15-20x moins cher que GPT-4)
- **Contexte énorme** (1M tokens = plusieurs documents)
- **Excellent en français** (entraîné multilingue)
- **Latence faible** (~1-2 secondes)
- **Sécurité intégrée** (filtres automatiques)

### ⚠️ Considérations
- **Pas de streaming natif** (simulation avec découpage)
- **API moins mature** que OpenAI (mais stable)
- **Rate limits** à surveiller en production

## 🔄 Migration depuis autre LLM

Si vous migrez depuis OpenAI/Claude :
```python
# Avant (OpenAI)
response = openai.ChatCompletion.create(...)

# Après (Gemini)
response = model.generate_content(prompt)
```

L'adaptation est déjà faite dans `phoenix_rag_gemini.py` ! 🎉

---

**Setup terminé !** PhoenixCare est prêt à utiliser Gemini 1.5 Flash ! 🚀