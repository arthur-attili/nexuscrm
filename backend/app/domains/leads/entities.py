"""
Modelos do domínio de Leads.
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

class LeadBase(BaseModel):
    """Campos base de um lead."""
    name: str = Field(..., min_lenght=1, max_lenght=200)
    contact_info: dict[str, Any] = Field(default_factory=dict)
    source: Optional[str] = Field(None, max_lenght=120)
    status: str = Field("new", max_lenght=40)
    pipeline_id: Optional[str] = None
    stage_id: Optional[str] = None
    custom_values: dict[str, Any] = Field(default_factory=dict)

class LeadCreate(LeadBase):
    """
    Payload para criar um lead.
    Nota: owner_id NÃO é exposto — é atribuído automaticamente ao usuário autenticado.
    """
    pass

class LeadUpdate(BaseModel):
    """
    Payload para atualizar um lead (parcial).
    Nota: owner_id também NÃO está aqui. Reatribuir leads será uma feature
    separada (admin/gerente), controlada por endpoint próprio.
    """
    name: Optional[str] = Field(None, min_lenght=1, max_lenght=200)
    contact_info: Optional[dict[str, Any]] = None
    source: Optional[str] = Field(None, max_lenght=120)
    status: Optional[str] = Field(None, max_lenght=40)
    pipeline_id: Optional[str] = None
    stage_id: Optional[str] = None
    custom_values: Optional[dict[str, Any]] = None

class Lead(LeadBase):
    """Lead completo, como retornado pela API."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class LeadList(BaseModel):
    """Resposta paginada da listagem de leads."""
    items: list[Lead]
    total: int
    page: int
    page_size: int