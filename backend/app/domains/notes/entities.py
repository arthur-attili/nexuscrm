"""
Modelos do domínio de Notas.

Notas são polimórficas: podem pertencer a um lead OU a um deal,
identificado pelos campos `record_type` e `record_id`.

Estratégia:
- ESCRITA (NoteCreate / NoteUpdate): estrita. Bloqueia notas vazias.
- LEITURA (Note): tolerante. Aceita dados legados/corrompidos sem quebrar,
  mas registra um aviso no log para monitoramento.
"""

import logging
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

logger = logging.getLogger(__name__)

RecordType = Literal["lead", "deal"]


# ============================================================
# Criação (estrito)
# ============================================================


class NoteCreate(BaseModel):
    """Payload para criar uma nota. Exige conteúdo."""
    record_type: RecordType
    record_id: str
    content: str = Field(..., min_length=1, max_length=5000)
    pinned: bool = False


# ============================================================
# Atualização (estrito no que for enviado)
# ============================================================


class NoteUpdate(BaseModel):
    """Payload para atualizar uma nota (parcial)."""
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    pinned: Optional[bool] = None


# ============================================================
# Leitura (tolerante + observável)
# ============================================================


class Note(BaseModel):
    """
    Nota completa, como retornada pela API.

    Aceita `content` vazio por tolerância a dados legados, mas registra
    um aviso em log para que o problema seja corrigido.
    """
    model_config = ConfigDict(from_attributes=True)

    id: str
    record_type: RecordType
    record_id: str
    content: str = Field(default="", max_length=5000)
    author_id: Optional[str] = None
    author_name: Optional[str] = None
    pinned: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("content")
    @classmethod
    def log_empty_content(cls, v: str) -> str:
        """
        Detecta conteúdo vazio e registra aviso. Não bloqueia a leitura,
        mas deixa rastro para investigação.
        """
        if not v or not v.strip():
            logger.warning(
                "[notes] Registro com conteúdo vazio detectado. "
                "Considere limpar dados corrompidos (SELECT em notes WHERE content = '')."
            )
        return v