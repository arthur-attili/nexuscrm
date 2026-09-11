"""
Modelos do domínio de Pipelines e Stages.
Stage é parte do agregado Pipeline (não existe sem um pipeline).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# ============================================================
# Stages
# ============================================================


class StageBase(BaseModel):
    """Campos base de uma stage."""
    name: str = Field(..., min_length=1, max_length=80)
    order: int = Field(..., ge=0, description="Ordem na visualização do funil.")
    is_won: bool = False
    is_lost: bool = False


class StageCreate(StageBase):
    """Payload para criar uma stage."""
    pass


class StageUpdate(BaseModel):
    """Payload para atualizar uma stage (parcial)."""
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    order: Optional[int] = Field(None, ge=0)
    is_won: Optional[bool] = None
    is_lost: Optional[bool] = None


class Stage(StageBase):
    """Stage completa, como retornada pela API."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    pipeline_id: str
    created_at: datetime


# ============================================================
# Pipelines
# ============================================================


class PipelineBase(BaseModel):
    """Campos base de um pipeline."""
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    is_default: bool = False


class PipelineCreate(PipelineBase):
    """Payload para criar um pipeline."""
    pass


class PipelineUpdate(BaseModel):
    """Payload para atualizar um pipeline (parcial)."""
    name: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = None
    is_default: Optional[bool] = None


class Pipeline(PipelineBase):
    """Pipeline completo, como retornado pela API."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


class PipelineWithStages(Pipeline):
    """Pipeline com suas stages aninhadas (para GET /pipelines/{id})."""
    stages: list[Stage] = []