#!/usr/bin/env python3
"""
Script d'audit qualité du système RAG
Teste 10 questions pour détecter hallucinations et confusions
"""

import json
import sys
from pathlib import Path

# Questions de test
TEST_QUESTIONS = [
    {
        "id": 1,
        "question": "Je suis bénéficiaire AAH, puis-je travailler ?",
        "expected_keywords": ["cumul", "6 mois", "abattement", "80%", "différentielle"]
    },
    {
        "id": 2,
        "question": "Quelle est la différence entre ESAT et entreprise adaptée ?",
        "expected_keywords": ["salarié", "travailleur handicapé", "SMIC", "rémunération garantie"]
    },
    {
        "id": 3,
        "question": "Mon père a eu un AVC, quels sont ses droits ?",
        "expected_keywords": ["PCH", "AAH", "séquelles", "MDPH", "hémiplégie"]
    },
    {
        "id": 4,
        "question": "J'ai un cancer, puis-je demander la RQTH ?",
        "expected_keywords": ["RQTH", "retour emploi", "aménagement", "temps partiel thérapeutique"]
    },
    {
        "id": 5,
        "question": "Combien coûte une AESH pour mon enfant ?",
        "expected_keywords": ["gratuit", "Éducation nationale", "MDPH", "notification"]
    },
    {
        "id": 6,
        "question": "Je touche une rente accident du travail, puis-je avoir l'AAH ?",
        "expected_keywords": ["différentielle", "cumul", "IPP", "subsidiaire"]
    },
    {
        "id": 7,
        "question": "Mon enfant a un taux d'incapacité de 60%, a-t-il droit à l'AEEH ?",
        "expected_keywords": ["50%", "79%", "établissement spécialisé", "fréquentation"]
    },
    {
        "id": 8,
        "question": "RSA ou AAH : que choisir ?",
        "expected_keywords": ["non cumulables", "plus avantageux", "1 033", "handicap"]
    },
    {
        "id": 9,
        "question": "Comment faire une demande de PCH ?",
        "expected_keywords": ["MDPH", "Cerfa 15692", "4 mois", "certificat médical"]
    },
    {
        "id": 10,
        "question": "Mon fils autiste peut-il avoir un PPS ?",
        "expected_keywords": ["PPS", "MDPH", "scolarisation", "AESH", "aménagements"]
    }
]


def load_knowledge_base():
    """Charge la base de connaissances"""
    kb_path = Path(__file__).parent / "config" / "knowledge_base.json"
    with open(kb_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def simple_keyword_search(query: str, knowledge_base: dict, top_k=5):
    """Recherche simple par mots-clés (comme le vrai RAG)"""
    query_lower = query.lower()
    query_words = set(query_lower.split())

    scores = []
    for doc_id, doc in knowledge_base.items():
        keywords = [kw.lower() for kw in doc.get('keywords', [])]
        title_lower = doc['title'].lower()

        # Score basé sur keywords matchés
        keyword_matches = sum(1 for kw in keywords if kw in query_lower)

        # Score basé sur mots query dans titre
        title_matches = sum(1 for word in query_words if word in title_lower)

        # Score total
        total_score = (keyword_matches * 2) + title_matches

        if total_score > 0:
            scores.append({
                'id': doc_id,
                'title': doc['title'],
                'score': total_score,
                'keywords': keywords[:5]
            })

    # Trier par score
    scores.sort(key=lambda x: x['score'], reverse=True)
    return scores[:top_k]


def audit_question(q, kb):
    """Audite une question"""
    print(f"\n{'='*80}")
    print(f"Q{q['id']}: {q['question']}")
    print(f"{'='*80}")

    results = simple_keyword_search(q['question'], kb, top_k=5)

    if not results:
        print("⚠️  AUCUN DOCUMENT TROUVÉ - PROBLÈME CRITIQUE")
        return {'status': 'FAIL', 'reason': 'no_results'}

    print(f"\n📄 Top 5 documents retournés:")
    for i, result in enumerate(results, 1):
        print(f"  {i}. [{result['score']} pts] {result['title']}")
        print(f"     Keywords: {', '.join(result['keywords'])}")

    # Vérifier si les keywords attendus sont dans le top 1
    top_doc = results[0]
    found_keywords = [kw for kw in q['expected_keywords']
                      if any(kw.lower() in keyword for keyword in top_doc['keywords'])]

    print(f"\n🔍 Keywords attendus trouvés dans top 1: {found_keywords}")

    if len(found_keywords) >= 2:
        print("✅ PERTINENCE: Bonne")
        return {'status': 'PASS', 'score': top_doc['score']}
    elif len(results) > 1:
        # Vérifier top 2-3
        for result in results[1:3]:
            found_in_others = [kw for kw in q['expected_keywords']
                               if any(kw.lower() in keyword for keyword in result['keywords'])]
            if len(found_in_others) >= 2:
                print(f"⚠️  PERTINENCE: Moyenne (bonne réponse en position {results.index(result)+1})")
                return {'status': 'WARNING', 'correct_position': results.index(result)+1}

        print("❌ PERTINENCE: Mauvaise (pas de bonne réponse dans top 3)")
        return {'status': 'FAIL', 'reason': 'irrelevant_results'}
    else:
        print("❌ PERTINENCE: Mauvaise")
        return {'status': 'FAIL', 'reason': 'irrelevant_results'}


def main():
    print("🔍 AUDIT QUALITÉ - Système RAG PhoenixCare")
    print(f"Base de connaissances: 50 fiches\n")

    kb = load_knowledge_base()
    print(f"✅ Base chargée: {len(kb)} documents\n")

    results = []
    for q in TEST_QUESTIONS:
        result = audit_question(q, kb)
        results.append({**q, **result})

    # Rapport final
    print(f"\n{'='*80}")
    print("📊 RAPPORT FINAL")
    print(f"{'='*80}\n")

    pass_count = sum(1 for r in results if r['status'] == 'PASS')
    warning_count = sum(1 for r in results if r['status'] == 'WARNING')
    fail_count = sum(1 for r in results if r['status'] == 'FAIL')

    print(f"✅ PASS:    {pass_count}/10 ({pass_count*10}%)")
    print(f"⚠️  WARNING: {warning_count}/10 ({warning_count*10}%)")
    print(f"❌ FAIL:    {fail_count}/10 ({fail_count*10}%)")

    print(f"\n📈 Score global: {(pass_count + warning_count*0.5) * 10:.0f}%")

    if fail_count > 0:
        print(f"\n❌ Questions échouées:")
        for r in results:
            if r['status'] == 'FAIL':
                print(f"  - Q{r['id']}: {r['question']}")
                print(f"    Raison: {r.get('reason', 'unknown')}")

    if warning_count > 0:
        print(f"\n⚠️  Questions avec warnings:")
        for r in results:
            if r['status'] == 'WARNING':
                print(f"  - Q{r['id']}: {r['question']}")
                print(f"    Bonne réponse en position: {r.get('correct_position')}")

    print(f"\n{'='*80}")

    # Recommandations
    if pass_count >= 8:
        print("✅ QUALITÉ EXCELLENTE - Pas d'action requise")
    elif pass_count >= 6:
        print("⚠️  QUALITÉ CORRECTE - Amélioration keywords recommandée")
    else:
        print("❌ QUALITÉ INSUFFISANTE - Révision keywords urgente")

    return 0 if pass_count >= 7 else 1


if __name__ == "__main__":
    sys.exit(main())
