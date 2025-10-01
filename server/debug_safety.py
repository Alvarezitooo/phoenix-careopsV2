#!/usr/bin/env python3
"""
🔍 DEBUG SAFETY GEMINI
Analyse détaillée des problèmes de sécurité/tokens
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

def debug_safety_issue():
    """Debug détaillé du problème Gemini"""

    print("🔍 DEBUG SAFETY GEMINI")
    print("=" * 30)

    load_dotenv()
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

    # Test avec configuration sécurité minimale
    safety_settings = [
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "BLOCK_NONE"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "BLOCK_NONE"
        }
    ]

    # Configuration simple
    generation_config = {
        "temperature": 0.1,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 100,  # Très court pour éviter limite
    }

    model = genai.GenerativeModel(
        model_name="models/gemini-2.5-flash",
        generation_config=generation_config,
        safety_settings=safety_settings
    )

    # Tests progressifs
    test_prompts = [
        "Bonjour",  # Ultra simple
        "Dis bonjour en français",  # Simple
        "Qu'est-ce que l'AEEH ?",  # PhoenixCare
        "Tu es un assistant IA. Dis bonjour.",  # Avec contexte
    ]

    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n🧪 Test {i}: '{prompt}'")

        try:
            response = model.generate_content(prompt)

            # Debug détaillé de la réponse
            print(f"📊 Analyse réponse:")
            print(f"   - Candidates: {len(response.candidates) if response.candidates else 0}")

            if response.candidates:
                candidate = response.candidates[0]
                print(f"   - Finish reason: {candidate.finish_reason}")
                print(f"   - Finish reason (nom): {candidate.finish_reason.name if hasattr(candidate.finish_reason, 'name') else 'N/A'}")

                # Safety ratings
                if hasattr(candidate, 'safety_ratings'):
                    print(f"   - Safety ratings: {len(candidate.safety_ratings) if candidate.safety_ratings else 0}")
                    for rating in candidate.safety_ratings or []:
                        print(f"     * {rating.category}: {rating.probability}")

                # Contenu
                if candidate.content and candidate.content.parts:
                    print(f"   - Contenu: '{candidate.content.parts[0].text[:100]}...'")
                    print(f"   ✅ SUCCÈS!")
                else:
                    print(f"   ❌ Pas de contenu généré")
            else:
                print(f"   ❌ Aucun candidat")

            # Prompt feedback
            if hasattr(response, 'prompt_feedback'):
                feedback = response.prompt_feedback
                print(f"   - Prompt feedback: {feedback}")
                if hasattr(feedback, 'safety_ratings'):
                    for rating in feedback.safety_ratings or []:
                        print(f"     * Input {rating.category}: {rating.probability}")

        except Exception as e:
            print(f"   ❌ Erreur: {e}")

    # Test avec modèle différent si problème persiste
    print(f"\n🔄 Test avec modèle alternatif:")
    try:
        alt_model = genai.GenerativeModel("models/gemini-2.0-flash")
        alt_response = alt_model.generate_content("Dis bonjour")

        if alt_response.text:
            print(f"   ✅ Gemini 2.0 Flash fonctionne: {alt_response.text}")
        else:
            print(f"   ❌ Même problème avec 2.0")

    except Exception as e:
        print(f"   ❌ Erreur 2.0: {e}")

if __name__ == "__main__":
    debug_safety_issue()