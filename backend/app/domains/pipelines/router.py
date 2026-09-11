"""
Router HTTP do domínio de Pipelines e Stages.
"""

from fastapi import APIRouter, Depends, status
from gotrue.types import User

from app.core.auth import get_current_user
from app.domains.pipelines.entities import (
    Pipeline,
    PipelineCreate,
    PipelineUpdate,
    PipelineWithStages,
    Stage,
    StageCreate,
    StageUpdate,
)
from app.domains.pipelines.service import PipelineService, StageService

# Todos os endpoints deste router exigem autenticação.
router = APIRouter(
    prefix="/pipelines",
    tags=["Pipelines"],
    dependencies=[Depends(get_current_user)],
)


# ============================================================
# Dependências (injeção de serviço — facilita testes com mock)
# ============================================================


def get_pipeline_service() -> PipelineService:
    return PipelineService()


def get_stage_service() -> StageService:
    return StageService()


# ============================================================
# Pipelines
# ============================================================


@router.get("", response_model=list[Pipeline])
def list_pipelines(
    service: PipelineService = Depends(get_pipeline_service),
) -> list[Pipeline]:
    """Lista todos os pipelines."""
    return service.list_pipelines()


@router.post("", response_model=Pipeline, status_code=status.HTTP_201_CREATED)
def create_pipeline(
    payload: PipelineCreate,
    service: PipelineService = Depends(get_pipeline_service),
) -> Pipeline:
    """Cria um novo pipeline."""
    return service.create_pipeline(payload)


@router.get("/{pipeline_id}", response_model=PipelineWithStages)
def get_pipeline(
    pipeline_id: str,
    service: PipelineService = Depends(get_pipeline_service),
) -> PipelineWithStages:
    """Retorna um pipeline com suas stages aninhadas."""
    return service.get_pipeline_with_stages(pipeline_id)


@router.patch("/{pipeline_id}", response_model=Pipeline)
def update_pipeline(
    pipeline_id: str,
    payload: PipelineUpdate,
    service: PipelineService = Depends(get_pipeline_service),
) -> Pipeline:
    """Atualiza um pipeline existente."""
    return service.update_pipeline(pipeline_id, payload)


@router.delete("/{pipeline_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pipeline(
    pipeline_id: str,
    service: PipelineService = Depends(get_pipeline_service),
) -> None:
    """Remove um pipeline (e todas as suas stages via CASCADE)."""
    service.delete_pipeline(pipeline_id)


# ============================================================
# Stages (aninhadas em /pipelines/{pipeline_id}/stages)
# ============================================================


@router.get("/{pipeline_id}/stages", response_model=list[Stage])
def list_stages(
    pipeline_id: str,
    service: StageService = Depends(get_stage_service),
) -> list[Stage]:
    """Lista as stages de um pipeline."""
    return service.list_stages(pipeline_id)


@router.post(
    "/{pipeline_id}/stages",
    response_model=Stage,
    status_code=status.HTTP_201_CREATED,
)
def create_stage(
    pipeline_id: str,
    payload: StageCreate,
    service: StageService = Depends(get_stage_service),
) -> Stage:
    """Cria uma nova stage em um pipeline."""
    return service.create_stage(pipeline_id, payload)


# As rotas abaixo usam /stages/{stage_id} para operar em uma stage individual.
# Ficam no mesmo router, mas sem o prefixo do pipeline.
@router.patch(
    "/stages/{stage_id}",
    response_model=Stage,
)
def update_stage(
    stage_id: str,
    payload: StageUpdate,
    service: StageService = Depends(get_stage_service),
) -> Stage:
    """Atualiza uma stage existente."""
    return service.update_stage(stage_id, payload)


@router.delete(
    "/stages/{stage_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_stage(
    stage_id: str,
    service: StageService = Depends(get_stage_service),
) -> None:
    """Remove uma stage."""
    service.delete_stage(stage_id)