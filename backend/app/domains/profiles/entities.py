"""
Modelos do domínio de Perfis (Profiles).
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

UserRole = Literal["admin", "gerente", "vendedor"]


class ProfileBase(BaseModel):
    """Campos base de um perfil."""
    name: str = Field(..., min_length=1, max_length=120)
    role: UserRole = "vendedor"
    avatar_url: Optional[str] = None


class ProfileUpdate(BaseModel):
    """
    Campos atualizáveis pelo próprio usuário.
    Nota: 'role' NÃO está aqui — apenas admins podem alterar papéis (endpoint futuro).
    """
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    avatar_url: Optional[str] = None


class Profile(ProfileBase):
    """Perfil completo, como retornado pela API."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime