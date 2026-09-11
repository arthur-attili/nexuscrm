"""
Modelos do domínio de Deals (Negócios).
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field

DealStatus = Literal["open", "won", "lost"]


class DealBase(BaseModel):
    """Campos base de um deal."""
    lead_id: str
    pipeline_id: str
    stage_id: Optional[str] = None
    value: Decimal = Field(..., gt=0, description="Valor total do negócio")
    credit_value: Optional[Decimal] = Field(None, ge=0)
    down_payment: Optional[Decimal] = Field(None, ge=0)
    installment: Optional[Decimal] = Field(None, ge=0)
    probability: int = Field(0, ge=0, le=100)
    expected_close_date: Optional[date] = None
    custom_values: dict[str, Any] = Field(default_factory=dict)


class DealCreate(DealBase):
    """
    Payload para criar um deal.
    - Não expõe 'status': todo deal nasce como 'open'.
    - Não expõe 'owner_id': o dono é o usuário logado.
    - Se 'stage_id' não for informado, o service usa a primeira stage do pipeline.
    """
    pass


class DealUpdate(BaseModel):
    """
    Payload para atualizar um deal (parcial).
    - 'owner_id' não é exposto: reatribuição será endpoint dedicado.
    - 'lead_id' não é exposto: o lead de um deal é imutável.
    """
    pipeline_id: Optional[str] = None
    stage_id: Optional[str] = None
    value: Optional[Decimal] = Field(None, gt=0)
    credit_value: Optional[Decimal] = Field(None, ge=0)
    down_payment: Optional[Decimal] = Field(None, ge=0)
    installment: Optional[Decimal] = Field(None, ge=0)
    probability: Optional[int] = Field(None, ge=0, le=100)
    expected_close_date: Optional[date] = None
    status: Optional[DealStatus] = None
    custom_values: Optional[dict[str, Any]] = None


class Deal(DealBase):
    """Deal completo, como retornado pela API."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: Optional[str] = None
    status: DealStatus = "open"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class DealList(BaseModel):
    """Resposta paginada da listagem de deals."""
    items: list[Deal]
    total: int
    page: int
    page_size: int