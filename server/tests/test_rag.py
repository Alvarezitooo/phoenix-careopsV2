"""
🧪 Tests pour le service RAG
"""
import pytest
from services.rag import (
    find_relevant_documents,
    sanitize_input,
    extract_suggestions,
    fuzzy_match
)


def test_sanitize_input():
    """Test sanitization des inputs"""
    # Test limites de longueur
    long_text = "a" * 3000
    result = sanitize_input(long_text, max_length=2000)
    assert len(result) == 2000

    # Test suppression des triples quotes
    dangerous = 'Test """injection"""'
    result = sanitize_input(dangerous)
    assert '"""' not in result

    # Test caractères de contrôle
    control_chars = "Test\x00\x01normal"
    result = sanitize_input(control_chars)
    assert result == "Testnormal"


def test_extract_suggestions():
    """Test extraction des suggestions"""
    text_with_suggestions = """Réponse principale.

SUGGESTIONS:
- Suggestion 1
- Suggestion 2
- Suggestion 3"""

    answer, suggestions = extract_suggestions(text_with_suggestions)

    assert "Réponse principale" in answer
    assert "SUGGESTIONS" not in answer
    assert len(suggestions) == 3
    assert "Suggestion 1" in suggestions


def test_fuzzy_match():
    """Test du matching flou"""
    # Match exact
    assert fuzzy_match("AEEH", "AEEH") == 1.0

    # Match partiel
    score = fuzzy_match("AEEH", "AEH")
    assert 0.5 < score < 1.0


def test_find_relevant_documents():
    """Test recherche de documents"""
    results = find_relevant_documents("Comment obtenir l'AEEH ?")

    # Doit retourner une liste
    assert isinstance(results, list)

    # Max 3 résultats
    assert len(results) <= 3

    # Structure correcte
    if results:
        doc = results[0]
        assert "id" in doc
        assert "title" in doc
        assert "content" in doc
        assert "score" in doc
