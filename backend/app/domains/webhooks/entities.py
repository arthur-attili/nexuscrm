"""
Modelos do domínio de Webhooks.

Webhooks permitem que sistemas externos (n8n, Zapier, backend próprio)
recebam notificações quando eventos acontecem no CRM.
"""

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Eventos suportados
WebhookEvent = Literal[
    "lead.created",
    "lead.updated",
    "deal.created",
    "deal.updated",
    "deal.status_changed",
    "note.created",
]

VALID_EVENTS: set[str] = {
    "lead.created",
    "lead.updated",
    "deal.created",
    "deal.updated",
    "deal.status_changed",
    "note.created",
}


# ============================================================
# Base
# ============================================================


def _validate_url(v: str) -> str:
    v = v.strip()
    if not (v.startswith("http://") or v.startswith("https://")):
        raise ValueError("A URL deve começar com http:// ou https://")
    if len(v) > 2000:
        raise ValueError("URL muito longa (máx. 2000 caracteres).")
    return v


def _validate_events(v: list[str]) -> list[str]:
    if not v:
        raise ValueError("Selecione pelo menos um evento.")
    # Deduplica preservando ordem
    deduped = list(dict.fromkeys(v))
    invalid = [e for e in deduped if e not in VALID_EVENTS]
    if invalid:
        raise ValueError(f"Eventos inválidos: {', '.join(invalid)}")
    return deduped


# ============================================================
# Criação / Atualização
# ============================================================


class WebhookCreate(BaseModel):
    """Payload para criar um webhook."""
    name: str = Field(..., min_length=1, max_length=120)
    url: str = Field(..., min_length=1, max_length=2000)
    events: list[WebhookEvent] = Field(..., min_length=1)
    is_active: bool = True

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        return _validate_url(v)

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: list[str]) -> list[str]:
        return _validate_events(v)


class WebhookUpdate(BaseModel):
    """Payload para atualizar um webhook (parcial)."""
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    url: Optional[str] = Field(None, min_length=1, max_length=2000)
    events: Optional[list[WebhookEvent]] = None
    is_active: Optional[bool] = None

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return _validate_url(v)

    @field_validator("events")
    @classmethod
    def validate_events(cls, v: Optional[list[str]]) -> Optional[list[str]]:
        if v is None:
            return v
        return _validate_events(v)


# ============================================================
# Leitura
# ============================================================


class Webhook(BaseModel):
    """
    Webhook completo, como retornado pela API.

    ⚠️ O `secret` é exposto propositalmente: o cliente precisa dele
    para validar a assinatura HMAC dos payloads recebidos.
    """
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    url: str
    secret: str
    events: list[str]
    is_active: bool = True
    owner_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class WebhookDelivery(BaseModel):
    """Registro de uma tentativa de entrega de webhook."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    webhook_id: str
    event: str
    payload: dict[str, Any]
    response_status: Optional[int] = None
    response_body: Optional[str] = None
    success: bool = False
    attempts: int = 0
    error: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None