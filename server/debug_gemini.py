#!/usr/bin/env python3
"""
🔧 DEBUG GEMINI API
Test de l'API Gemini et liste des modèles disponibles
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

def debug_gemini():
    """Debug de l'API Gemini"""

    print("🔧 DEBUG GEMINI API")
    print("=" * 30)

    # Chargement variables
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        print("❌ GEMINI_API_KEY non trouvée!")
        return

    print(f"✅ API Key trouvée: {api_key[:20]}...")

    try:
        # Configuration
        genai.configure(api_key=api_key)

        # Liste des modèles disponibles
        print("\n📋 MODÈLES DISPONIBLES:")
        print("-" * 25)

        models = genai.list_models()
        available_models = []

        for model in models:
            print(f"- {model.name}")
            available_models.append(model.name)

            # Vérifier les méthodes supportées
            if hasattr(model, 'supported_generation_methods'):
                methods = model.supported_generation_methods
                print(f"  Méthodes: {methods}")

        # Test avec un modèle qui marche
        print(f"\n🧪 TEST AVEC MODÈLES DISPONIBLES:")
        print("-" * 35)

        # Essayer les modèles communs
        test_models = [
            "models/gemini-pro",
            "models/gemini-1.5-pro",
            "models/gemini-1.5-flash",
            "gemini-pro",
            "gemini-1.5-pro",
            "gemini-1.5-flash"
        ]

        for model_name in test_models:
            if any(model_name in available for available in available_models):
                print(f"\n✅ Test avec {model_name}:")
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content("Dis bonjour en français")

                    if response.text:
                        print(f"   ✅ Fonctionne! Réponse: {response.text[:100]}...")

                        # Test avec PhoenixCare
                        print(f"\n🧪 Test PhoenixCare avec {model_name}:")

                        phoenix_model = genai.GenerativeModel(
                            model_name=model_name,
                            generation_config={
                                "temperature": 0.3,
                                "max_output_tokens": 500,
                            }
                        )

                        test_response = phoenix_model.generate_content("""
Tu es PhoenixIA, assistant expert en droit du handicap français.

Question: Qu'est-ce que l'AEEH ?

Réponds en français de manière empathique et informative.
""")

                        if test_response.text:
                            print(f"   ✅ PhoenixCare fonctionne!")
                            print(f"   📝 Réponse: {test_response.text[:200]}...")

                            # Sauvegarder le modèle qui marche
                            with open(".env", "a") as f:
                                f.write(f"\nGEMINI_MODEL_NAME={model_name}\n")

                            print(f"   💾 Modèle sauvegardé: {model_name}")
                            return model_name

                except Exception as e:
                    print(f"   ❌ Erreur avec {model_name}: {e}")

        print("\n❌ Aucun modèle fonctionnel trouvé")
        return None

    except Exception as e:
        print(f"❌ Erreur API Gemini: {e}")
        return None

if __name__ == "__main__":
    working_model = debug_gemini()

    if working_model:
        print(f"\n🎉 SUCCÈS! Modèle fonctionnel: {working_model}")
        print("🚀 Vous pouvez maintenant utiliser PhoenixCare!")
    else:
        print("\n❌ Problème avec l'API Gemini")
        print("💡 Vérifiez:")
        print("1. Validité de la clé API")
        print("2. Quotas Google Cloud")
        print("3. Région/restrictions")