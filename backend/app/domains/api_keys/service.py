"""
Serviço de API Keys: geração, validação e gestão.

Regras de segurança:
- O token NUNCA é armazenado em plaintext — apenas o hash SHA-256.
- O token completo é retornado apenas UMA VEZ (na criação).
- Cada key pertence a um usuário (owner_id).
- Só admin pode criar chaves em nome de outros; por enquanto, cada usuário
  gerencia as suas.
"""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.domains.api_keys.entities import (
    ApiKey,
    ApiKeyCreate,
    ApiKeyCreated,
)
from app.domains.api_keys.repository import ApiKeyRepository
from app.shared.dependencies import CurrentUser

# Prefixo que identifica as chaves geradas pelo NexusCRM
API_KEY_PREFIX = "nxk_"


def _generate_token() -> tuple[str, str, str]:
    """
    Gera um novo token de API.

    Retorna (token_completo, prefixo_visivel, hash_sha256).
    """
    random_part = secrets.token_urlsafe(32)  # ~43 caracteres
    token = f"{API_KEY_PREFIX}{random_part}"
    prefix = token[:12]  # "nxk_XXXXXXXX"
    key_hash = hashlib.sha256(token.encode()).hexdigest()
    return token, prefix, key_hash


def _hash_token(token: str) -> str:
    """Calcula o hash SHA-256 de um token."""
    return hashlib.sha256(token.encode()).hexdigest()


class ApiKeyService:
    """Regras de negócio para API keys."""

    def __init__(self, repo: ApiKeyRepository | None = None):
        self.repo = repo or ApiKeyRepository()

    # --------------------------------------------------------
    # Criar
    # --------------------------------------------------------

    def create_key(
        self, payload: ApiKeyCreate, current: CurrentUser
    ) -> ApiKeyCreated:
        """
        Cria uma nova API key para o usuário logado.

        O token é gerado, hasheado e o plaintext é retornado apenas nesta
        resposta. Depois disso, é impossível recuperá-lo.
        """
        token, prefix, key_hash = _generate_token()

        data = {
            "name": payload.name,
            "prefix": prefix,
            "key_hash": key_hash,
            "owner_id": current.id,
            "expires_at": (
                payload.expires_at.isoformat() if payload.expires_at else None
            ),
            "is_active": True,
        }

        created = self.repo.create(data)
        return ApiKeyCreated(**created, token=token)

    # --------------------------------------------------------
    # Listar
    # --------------------------------------------------------

    def list_keys(self, current: CurrentUser) -> list[ApiKey]:
        """
        Lista as API keys do usuário logado.

        Admin vê apenas as próprias também (por segurança).
        Retorna apenas metadados — NUNCA o token.
        """
        data = self.repo.list_by_owner(current.id)
        return [ApiKey(**row) for row in data]

    # --------------------------------------------------------
    # Deletar
    # --------------------------------------------------------

    def delete_key(self, key_id: str, current: CurrentUser) -> None:
        """Revoga (deleta) uma API key."""
        existing = self.repo.get_by_id(key_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key não encontrada.",
            )
        if existing["owner_id"] != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para deletar esta API key.",
            )

        deleted = self.repo.delete(key_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key não encontrada.",
            )

    # --------------------------------------------------------
    # Validação (usada pelo middleware de auth)
    # --------------------------------------------------------

    def validate_token(self, token: str) -> str | None:
        """
        Valida um token de API key.

        Retorna o `owner_id` se for válido, ou None caso contrário.
        Também atualiza `last_used_at` como efeito colateral.
        """
        if not token.startswith(API_KEY_PREFIX):
            return None

        key_hash = _hash_token(token)
        row = self.repo.get_by_hash(key_hash)
        if not row:
            return None

        if not row.get("is_active", True):
            return None

        expires_at = row.get("expires_at")
        if expires_at:
            try:
                exp = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                if exp < datetime.now(timezone.utc):
                    return None
            except ValueError:
                return None

        # Tracking de uso (silencioso)
        self.repo.update_last_used(
            row["id"], datetime.now(timezone.utc).isoformat()
        )

        return row["owner_id"]