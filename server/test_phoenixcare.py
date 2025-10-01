#!/usr/bin/env python3
"""
🧪 TESTS PHOENIXCARE
Script de test du système RAG après ingestion
"""

import asyncio
import os
import sys
from pathlib import Path

# Ajout du chemin du projet
sys.path.append(str(Path(__file__).parent / 'src'))

from ai.phoenix_rag_gemini import phoenix_rag
from ai.storage_optimizer import get_storage_summary

class PhoenixCareTest:
    """
    Suite de tests pour PhoenixCare
    """

    def __init__(self):
        self.test_questions = [
            {
                "question": "Qu'est-ce que l'AEEH ?",
                "expected_keywords": ["allocation", "éducation", "enfant", "handicapé"],
                "category": "Définition"
            },
            {
                "question": "Comment faire une demande AEEH ?",
                "expected_keywords": ["MDPH", "dossier", "formulaire", "Cerfa"],
                "category": "Procédure"
            },
            {
                "question": "Quel est le montant de l'AEEH en 2024 ?",
                "expected_keywords": ["149", "euro", "mois", "complément"],
                "category": "Montant"
            },
            {
                "question": "Qu'est-ce que la PCH ?",
                "expected_keywords": ["prestation", "compensation", "handicap"],
                "category": "Définition"
            },
            {
                "question": "Mon enfant autiste de 8 ans peut-il avoir une AESH ?",
                "expected_keywords": ["AESH", "accompagnant", "école", "MDPH"],
                "category": "Cas pratique"
            }
        ]

    async def run_all_tests(self):
        """
        Lance tous les tests PhoenixCare
        """
        print("🧪 TESTS PHOENIXCARE")
        print("=" * 30)

        # Test 1: Configuration
        await self._test_configuration()

        # Test 2: Stockage
        await self._test_storage()

        # Test 3: Questions/Réponses
        await self._test_qa_system()

        # Test 4: Performance
        await self._test_performance()

        print("\n✅ TOUS LES TESTS TERMINÉS!")

    async def _test_configuration(self):
        """
        Test de la configuration système
        """
        print("\n🔧 Test Configuration")
        print("-" * 20)

        # Test API Key
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            print("✅ GEMINI_API_KEY configurée")
        else:
            print("❌ GEMINI_API_KEY manquante")
            return False

        # Test services IA
        try:
            # Test simple sans recherche
            response = await phoenix_rag.generate_response(
                "Test de configuration", [], {}, {}
            )
            if response.answer:
                print("✅ Service Gemini fonctionnel")
            else:
                print("❌ Service Gemini non fonctionnel")
        except Exception as e:
            print(f"❌ Erreur Gemini: {e}")

        return True

    async def _test_storage(self):
        """
        Test du système de stockage
        """
        print("\n💾 Test Stockage")
        print("-" * 15)

        try:
            # Affichage des stats de stockage
            summary = get_storage_summary()
            print(summary)
        except Exception as e:
            print(f"❌ Erreur stockage: {e}")

    async def _test_qa_system(self):
        """
        Test du système de questions/réponses
        """
        print("\n💬 Test Questions/Réponses")
        print("-" * 25)

        total_tests = len(self.test_questions)
        passed_tests = 0

        for i, test_case in enumerate(self.test_questions, 1):
            print(f"\n[{i}/{total_tests}] {test_case['category']}")
            print(f"❓ {test_case['question']}")

            try:
                # Génération de la réponse
                response = await phoenix_rag.generate_response(
                    query=test_case['question'],
                    search_results=[],  # Pas de recherche pour le test
                    intent_analysis={},
                    user_context={}
                )

                if response.answer and len(response.answer) > 50:
                    print(f"✅ Réponse générée ({len(response.answer)} caractères)")
                    print(f"📝 Aperçu: {response.answer[:100]}...")

                    # Vérification des mots-clés
                    answer_lower = response.answer.lower()
                    found_keywords = [
                        kw for kw in test_case['expected_keywords']
                        if kw.lower() in answer_lower
                    ]

                    if found_keywords:
                        print(f"🎯 Mots-clés trouvés: {', '.join(found_keywords)}")
                        passed_tests += 1
                    else:
                        print(f"⚠️  Aucun mot-clé attendu trouvé")

                else:
                    print("❌ Réponse vide ou trop courte")

                print(f"⏱️  Temps: {response.processing_time:.1f}s")

            except Exception as e:
                print(f"❌ Erreur: {e}")

            await asyncio.sleep(1)  # Pause entre les tests

        success_rate = (passed_tests / total_tests) * 100
        print(f"\n📊 Résultat: {passed_tests}/{total_tests} tests réussis ({success_rate:.1f}%)")

        if success_rate >= 70:
            print("✅ Système QA fonctionnel")
        else:
            print("⚠️  Système QA à améliorer")

    async def _test_performance(self):
        """
        Test de performance
        """
        print("\n⚡ Test Performance")
        print("-" * 17)

        # Test de charge légère
        test_question = "Montant AEEH 2024"
        times = []

        print("🏃 Test de 5 requêtes rapides...")

        for i in range(5):
            try:
                response = await phoenix_rag.generate_response(
                    query=f"{test_question} (test {i+1})",
                    search_results=[],
                    intent_analysis={},
                    user_context={}
                )
                times.append(response.processing_time)
                print(f"  Requête {i+1}: {response.processing_time:.1f}s")

            except Exception as e:
                print(f"  Requête {i+1}: ❌ {e}")

        if times:
            avg_time = sum(times) / len(times)
            min_time = min(times)
            max_time = max(times)

            print(f"\n📊 Performance:")
            print(f"  Temps moyen: {avg_time:.1f}s")
            print(f"  Plus rapide: {min_time:.1f}s")
            print(f"  Plus lent: {max_time:.1f}s")

            if avg_time < 3.0:
                print("✅ Performance excellente")
            elif avg_time < 5.0:
                print("✅ Performance bonne")
            else:
                print("⚠️  Performance à optimiser")

async def main():
    """
    Lance les tests PhoenixCare
    """
    tester = PhoenixCareTest()
    await tester.run_all_tests()

    print("\n🎯 PROCHAINES ÉTAPES:")
    print("1. Si tests OK → PhoenixCare prêt !")
    print("2. Lancer serveur: python -m uvicorn main:app --reload")
    print("3. Tester interface: http://localhost:8000/api/chat/send")

if __name__ == "__main__":
    asyncio.run(main())