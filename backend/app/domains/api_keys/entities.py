"""
Modelos do domínio de API Keys.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ApiKeyBase(BaseModel):
    """Campos base de uma API key."""
    name: str = Field(..., min_length=1, max_length=80)


class ApiKeyCreate(ApiKeyBase):
    """Payload para criar uma API key."""
    expires_at: Optional[datetime] = None


class ApiKey(ApiKeyBase):
    """
    API key como retornada em listagens.

    ⚠️ NÃO inclui o token completo — só metadados.
    O token só é retornado UMA VEZ, no momento da criação.
    """
    model_config = ConfigDict(from_attributes=True)

    id: str
    prefix: str
    owner_id: str
    last_used_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ApiKeyCreated(ApiKey):
    """
    Retornado APENAS na criação de uma API key.
    Contém o token completo — deve ser copiado e guardado pelo cliente.
    """
    token: str