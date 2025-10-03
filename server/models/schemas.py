"""
📦 Schémas Pydantic pour validation automatique
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


# ===== Chat Models =====
class ChatRequest(BaseModel):
    """Requête de chat"""
    message: str = Field(..., min_length=1, max_length=2000)
    user_id: str = Field(..., min_length=1)
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Réponse du chat"""
    response: str
    sources: List[str] = []
    suggestions: List[str] = []
    cached: bool = False


# ===== Memory Models =====
class MemoryCreate(BaseModel):
    """Création d'une mémoire"""
    user_id: str
    memory_content: str = Field(..., min_length=1, max_length=1000)
    memory_type: str = Field(..., pattern="^(famille|médical|administratif|préférence)$")
    importance_score: int = Field(..., ge=1, le=10)


class Memory(BaseModel):
    """Mémoire utilisateur"""
    id: str
    user_id: str
    memory_content: str
    memory_type: str
    importance_score: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===== Document Models =====
class DocumentAnalyzeRequest(BaseModel):
    """Analyse de document"""
    document_content: str = Field(..., min_length=1)
    document_type: str = Field(default="administratif")
    user_id: str


class DocumentAnalyzeResponse(BaseModel):
    """Résultat d'analyse de document"""
    summary: str
    key_info: List[str]
    important_dates: List[str]
    recommended_actions: List[str]
    alerts: List[str]


# ===== Stripe Models =====
class CheckoutSessionRequest(BaseModel):
    """Création session Stripe"""
    user_id: str
    user_email: str
    plan: str = Field(..., pattern="^(monthly|yearly)$")


class CheckoutSessionResponse(BaseModel):
    """URL session checkout"""
    url: str


class CustomerPortalRequest(BaseModel):
    """Portail client Stripe"""
    user_id: str


class CustomerPortalResponse(BaseModel):
    """URL portail client"""
    url: str


# ===== Cache & Stats Models =====
class CacheStats(BaseModel):
    """Statistiques du cache"""
    hits: int
    misses: int
    size: int
    hit_rate: float


class MemoryStats(BaseModel):
    """Statistiques mémoire conversationnelle"""
    total_users: int
    total_messages: int
    avg_messages_per_user: float


# ===== Feedback Models =====
class FeedbackRequest(BaseModel):
    """Feedback utilisateur sur une réponse"""
    interaction_id: Optional[str] = None  # ID de l'interaction dans analytics
    user_id: str
    question: str
    response: str
    rating: int = Field(..., ge=1, le=5, description="Note de 1 (mauvais) à 5 (excellent)")
    comment: Optional[str] = Field(None, max_length=1000)


class FeedbackResponse(BaseModel):
    """Confirmation de feedback"""
    success: bool
    message: str
    feedback_id: Optional[str] = None


# ===== Health & Status =====
class HealthResponse(BaseModel):
    """État de santé du serveur"""
    status: str = "healthy"
    version: str
    gemini_available: bool
    supabase_available: bool
    cache_stats: Optional[Dict[str, Any]] = None
