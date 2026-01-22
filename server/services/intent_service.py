"""
Service de détection d'intention pour PhoenixCare.
Utilise des heuristiques simples pour catégoriser les requêtes utilisateur avec priorisation.
"""

def detect_intent(message: str) -> str:
    """
    Détecte l'intention principale d'un message utilisateur basé sur des mots-clés,
    avec une priorisation spécifique.

    Priorité: admin_courrier > admin_aide > suivi_demarche > perdu > fatigue > info_generale

    Args:
        message: Le message de l'utilisateur.

    Returns:
        L'intention détectée.
    """
    message_lower = message.lower()

    # 1. Intent: admin_courrier (Priorité la plus haute)
    if any(keyword in message_lower for keyword in ["courrier", "lettre", "répondre", "envoyer", "recevoir", "mdph", "caf", "document officiel"]):
        return "admin_courrier"

    # 2. Intent: admin_aide
    if any(keyword in message_lower for keyword in ["aide", "allocation", "aeeh", "aah", "pch", "dossier", "formulaire", "demande", "financement"]):
        return "admin_aide"

    # 3. Intent: suivi_demarche
    if any(keyword in message_lower for keyword in ["suivi", "où en est", "avancement", "délais", "réponse", "statut", "attente"]):
        return "suivi_demarche"

    # 4. Intent: perdu
    if any(keyword in message_lower for keyword in ["perdu", "comprends pas", "sais pas", "quoi faire", "bloqué", "aide moi", "comment faire"]):
        return "perdu"

    # 5. Intent: fatigue
    if any(keyword in message_lower for keyword in ["fatigué", "épuisé", "marre", "difficile", "dur", "besoin de souffler", "stress", "charge mentale"]):
        return "fatigue"

    # 6. Default intent: info_generale
    return "info_generale"
