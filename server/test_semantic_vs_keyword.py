#!/usr/bin/env python3
"""
🔬 Test comparatif : Recherche Sémantique vs Keyword Matching
Compare les performances des deux approches sur les mêmes questions
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Ajouter le dossier parent au path pour imports
sys.path.insert(0, str(Path(__file__).parent))

from services.rag import find_relevant_documents, load_knowledge_base

# Questions de test (réutilise celles de l'audit)
TEST_QUESTIONS = [
    {
        "id": 1,
        "question": "Je suis bénéficiaire AAH, puis-je travailler ?",
        "expected_doc": "aah_cumul_emploi_mva_2025"
    },
    {
        "id": 2,
        "question": "Quelle est la différence entre ESAT et entreprise adaptée ?",
        "expected_doc": "esat_vs_ea_2025"
    },
    {
        "id": 3,
        "question": "Mon père a eu un AVC, quels sont ses droits ?",
        "expected_doc": "avc_handicap_droits_2025"
    },
    {
        "id": 4,
        "question": "J'ai un cancer, puis-je demander la RQTH ?",
        "expected_doc": "cancer_sequelles_handicap_2025"
    },
    {
        "id": 5,
        "question": "Combien coûte une AESH pour mon enfant ?",
        "expected_doc": "aesh_2025"
    },
    {
        "id": 6,
        "question": "Je touche une rente accident du travail, puis-je avoir l'AAH ?",
        "expected_doc": "accident_travail_rente_cumuls_2025"
    },
    {
        "id": 7,
        "question": "Mon enfant a un taux d'incapacité de 60%, a-t-il droit à l'AEEH ?",
        "expected_doc": "aeeh_2025"
    },
    {
        "id": 8,
        "question": "RSA ou AAH : que choisir ?",
        "expected_doc": "rsa_aah_cumuls_2025"
    },
    {
        "id": 9,
        "question": "Comment faire une demande de PCH ?",
        "expected_doc": "pch_2025"
    },
    {
        "id": 10,
        "question": "Mon fils autiste peut-il avoir un PPS ?",
        "expected_doc": "pps_scolarisation_2025"
    }
]


def test_search_method(question: str, use_semantic: bool) -> list:
    """Teste une méthode de recherche"""
    return find_relevant_documents(question, use_semantic=use_semantic)


def compare_methods():
    """Compare les deux méthodes sur toutes les questions"""
    kb = load_knowledge_base()

    print("=" * 80)
    print("🔬 TEST COMPARATIF : Sémantique vs Keyword Matching")
    print("=" * 80)
    print(f"\n📚 Knowledge base: {len(kb)} documents\n")

    semantic_correct = 0
    keyword_correct = 0

    for q in TEST_QUESTIONS:
        print(f"\n{'='*80}")
        print(f"Q{q['id']}: {q['question']}")
        print(f"{'='*80}")
        print(f"📌 Document attendu: {q['expected_doc']}")

        # Test recherche sémantique
        print(f"\n🎯 RECHERCHE SÉMANTIQUE:")
        try:
            semantic_results = test_search_method(q['question'], use_semantic=True)
            if semantic_results and semantic_results[0]['id'] == q['expected_doc']:
                print(f"  ✅ CORRECT - Top 1: {semantic_results[0]['title']} (score: {semantic_results[0]['score']})")
                semantic_correct += 1
            else:
                if semantic_results:
                    print(f"  ❌ INCORRECT - Top 1: {semantic_results[0]['title']} (score: {semantic_results[0]['score']})")
                    # Chercher si doc attendu est dans top 3
                    for i, doc in enumerate(semantic_results, 1):
                        if doc['id'] == q['expected_doc']:
                            print(f"  ⚠️  Document attendu trouvé en position {i}")
                else:
                    print(f"  ❌ AUCUN RÉSULTAT")
        except Exception as e:
            print(f"  ❌ ERREUR: {e}")

        # Test recherche keyword
        print(f"\n🔑 RECHERCHE KEYWORD:")
        keyword_results = test_search_method(q['question'], use_semantic=False)
        if keyword_results and keyword_results[0]['id'] == q['expected_doc']:
            print(f"  ✅ CORRECT - Top 1: {keyword_results[0]['title']} (score: {keyword_results[0]['score']})")
            keyword_correct += 1
        else:
            if keyword_results:
                print(f"  ❌ INCORRECT - Top 1: {keyword_results[0]['title']} (score: {keyword_results[0]['score']})")
                for i, doc in enumerate(keyword_results, 1):
                    if doc['id'] == q['expected_doc']:
                        print(f"  ⚠️  Document attendu trouvé en position {i}")
            else:
                print(f"  ❌ AUCUN RÉSULTAT")

    # Rapport final
    print(f"\n{'='*80}")
    print("📊 RÉSULTATS COMPARATIFS")
    print(f"{'='*80}\n")

    semantic_accuracy = (semantic_correct / len(TEST_QUESTIONS)) * 100
    keyword_accuracy = (keyword_correct / len(TEST_QUESTIONS)) * 100

    print(f"🎯 RECHERCHE SÉMANTIQUE:")
    print(f"   Précision: {semantic_correct}/{len(TEST_QUESTIONS)} = {semantic_accuracy:.1f}%")
    print(f"\n🔑 RECHERCHE KEYWORD:")
    print(f"   Précision: {keyword_correct}/{len(TEST_QUESTIONS)} = {keyword_accuracy:.1f}%")

    improvement = semantic_accuracy - keyword_accuracy
    print(f"\n📈 AMÉLIORATION:")
    if improvement > 0:
        print(f"   +{improvement:.1f}% avec recherche sémantique ✅")
    elif improvement < 0:
        print(f"   {improvement:.1f}% (keyword meilleur) ⚠️")
    else:
        print(f"   Performances identiques")

    print(f"\n{'='*80}")

    # Recommandation
    if semantic_accuracy >= 80:
        print("✅ QUALITÉ EXCELLENTE - Recherche sémantique déployable en production")
    elif semantic_accuracy >= 70:
        print("⚠️  QUALITÉ CORRECTE - Ajustements recommandés (threshold, poids hybride)")
    else:
        print("❌ QUALITÉ INSUFFISANTE - Révision nécessaire")

    return 0 if semantic_accuracy >= 70 else 1


if __name__ == "__main__":
    sys.exit(compare_methods())
