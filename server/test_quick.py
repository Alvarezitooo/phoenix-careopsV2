#!/usr/bin/env python3
"""
⚡ Test rapide recherche sémantique (utilise le cache si disponible)
"""
from dotenv import load_dotenv
load_dotenv()

from services.rag import find_relevant_documents

# 3 questions tests
questions = [
    "Je suis bénéficiaire AAH, puis-je travailler ?",
    "Mon père a eu un AVC, quels sont ses droits ?",
    "RSA ou AAH : que choisir ?"
]

print("🔍 TEST RAPIDE - Recherche Sémantique\n")

for i, q in enumerate(questions, 1):
    print(f"{i}. Question: {q}")

    # Recherche sémantique
    print("   🎯 Sémantique:")
    results = find_relevant_documents(q, use_semantic=True)
    if results:
        print(f"      ✅ {results[0]['title']} (score: {results[0].get('score', 'N/A')})")

    # Recherche keyword
    print("   🔑 Keyword:")
    results_kw = find_relevant_documents(q, use_semantic=False)
    if results_kw:
        print(f"      ✅ {results_kw[0]['title']} (score: {results_kw[0]['score']})")
    print()
