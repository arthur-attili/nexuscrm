"""
Modelos do domínio de Atividades (tarefas, ligações, reuniões, etc).

Atividades são polimórficas: pertencem a um lead OU a um deal,
identificado por `record_type` e `record_id`.
"""

import logging
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)

RecordType = Literal["lead", "deal"]
ActivityType = Literal["call", "meeting", "email", "whatsapp", "task"]


# ============================================================
# Criação (estrito)
# ============================================================


class ActivityCreate(BaseModel):
    """Payload para criar uma atividade."""
    record_type: RecordType
    record_id: str
    type: ActivityType
    description: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None


# ============================================================
# Atualização (parcial)
# ============================================================


class ActivityUpdate(BaseModel):
    """Payload para atualizar uma atividade (parcial)."""
    type: Optional[ActivityType] = None
    description: Optional[str] = Field(None, max_length=2000)
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None


# ============================================================
# Leitura (tolerante + observável)
# ============================================================


class Activity(BaseModel):
    """Atividade completa, como retornada pela API."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    record_type: RecordType
    record_id: str
    type: ActivityType
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("type")
    @classmethod
    def log_unknown_type(cls, v: str) -> str:
        """Registra warning se encontrar tipo desconhecido (dados legados)."""
        valid = {"call", "meeting", "email", "whatsapp", "task"}
        if v not in valid:
            logger.warning(
                "[activities] Tipo desconhecido '%s' encontrado. "
                "Considere normalizar os dados.",
                v,
            )
        return v