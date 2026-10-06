"""
Dependências de autenticação do FastAPI.

Aceita dois tipos de credencial no header Authorization:
1. JWT do Supabase Auth (login tradicional no frontend).
2. API Key no formato `nxk_...` (integrações, n8n, HTTP requests externos).
"""

from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import auth_supabase

_bearer_scheme = HTTPBearer(auto_error=False)

API_KEY_PREFIX = "nxk_"


@dataclass
class AuthUser:
    """
    Representa o usuário autenticado, seja via JWT ou via API key.
    Expõe apenas `id` e `email` — o suficiente para os domínios usarem.
    """
    id: str
    email: Optional[str] = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuthUser:
    """
    Valida a credencial (JWT ou API key) e retorna o usuário autenticado.

    - Se começar com `nxk_`, é uma API key → valida no banco.
    - Caso contrário, é um JWT do Supabase → valida via `auth_supabase`.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação ausente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # --- Fluxo 1: API Key ---
    if token.startswith(API_KEY_PREFIX):
        # Import local para evitar import circular (auth ↔ api_keys)
        from app.domains.api_keys.service import ApiKeyService

        owner_id = ApiKeyService().validate_token(token)
        if not owner_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API key inválida ou expirada.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return AuthUser(id=owner_id)

    # --- Fluxo 2: JWT do Supabase ---
    try:
        response = auth_supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if response is None or response.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado para o token fornecido.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return AuthUser(id=str(response.user.id), email=response.user.email)