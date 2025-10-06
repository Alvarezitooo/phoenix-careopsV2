#!/usr/bin/env python3
"""
Test recherche sémantique PURE (sans import services/rag.py)
"""
from dotenv import load_dotenv
load_dotenv()

import json
from pathlib import Path
from services.semantic_search import semantic_search, load_embeddings_cache, create_knowledge_base_embeddings

# Charger KB
kb_path = Path(__file__).parent / "config" / "knowledge_base.json"
with open(kb_path, 'r') as f:
    kb = json.load(f)

print(f"📚 Knowledge base: {len(kb)} documents\n")

# Charger ou créer embeddings
print("🔄 Chargement cache embeddings...")
load_embeddings_cache()
create_knowledge_base_embeddings(kb)

# Test questions
questions = [
    "Je suis bénéficiaire AAH, puis-je travailler ?",
    "Mon père a eu un AVC, quels sont ses droits ?",
    "RSA ou AAH : que choisir ?"
]

print("\n🎯 TEST RECHERCHE SÉMANTIQUE\n")

for i, q in enumerate(questions, 1):
    print(f"{i}. {q}")
    results = semantic_search(q, kb, top_k=3)

    if results:
        for j, doc in enumerate(results, 1):
            print(f"   {j}. [{doc['score']:.3f}] {doc['title']}")
    else:
        print("   ❌ Aucun résultat")
    print()

print("✅ Test terminé !")
