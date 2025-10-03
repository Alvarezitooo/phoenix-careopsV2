"""
🔐 Service d'authentification avec Supabase JWT
"""
from typing import Optional, Dict, Any
from fastapi import HTTPException, Request, status
from jose import JWTError, jwt
from config.settings import settings


def verify_supabase_jwt(token: str) -> Optional[Dict[str, Any]]:
    """
    Vérifie et décode un JWT Supabase

    Args:
        token: JWT token depuis Authorization header

    Returns:
        Payload décodé avec user info ou None si invalide
    """
    if not settings.supabase_jwt_secret:
        print("⚠️  SUPABASE_JWT_SECRET manquant - auth désactivée")
        return None

    try:
        # Decode JWT avec la clé secrète Supabase
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"  # Supabase audience
        )

        return {
            "id": payload.get("sub"),  # User ID
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
            "metadata": payload.get("user_metadata", {})
        }

    except JWTError as e:
        print(f"❌ JWT validation error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected auth error: {e}")
        return None


async def get_current_user(request: Request) -> Dict[str, Any]:
    """
    Dependency pour extraire l'utilisateur depuis le JWT

    Usage dans endpoints:
    ```python
    @app.get("/protected")
    async def protected_route(user = Depends(get_current_user)):
        return {"user_id": user["id"]}
    ```

    Returns:
        User dict avec id, email, role

    Raises:
        HTTPException 401 si auth invalide
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header.replace("Bearer ", "")
    user = verify_supabase_jwt(token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_current_user_optional(request: Request) -> Optional[Dict[str, Any]]:
    """
    Version optionnelle de get_current_user qui ne raise pas d'exception

    Utilisé pour endpoints qui acceptent auth ET anonymous

    Returns:
        User dict ou None si pas authentifié
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.replace("Bearer ", "")
    return verify_supabase_jwt(token)


def check_admin_role(user: Dict[str, Any]) -> bool:
    """
    Vérifie si l'utilisateur a le rôle admin

    Args:
        user: User dict depuis get_current_user

    Returns:
        True si admin, False sinon
    """
    return user.get("role") == "admin" or user.get("metadata", {}).get("role") == "admin"


async def require_admin(request: Request) -> Dict[str, Any]:
    """
    Dependency pour routes admin uniquement

    Usage:
    ```python
    @app.get("/admin/stats")
    async def admin_stats(user = Depends(require_admin)):
        # Only admins can access
    ```
    """
    user = await get_current_user(request)

    if not check_admin_role(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return user
