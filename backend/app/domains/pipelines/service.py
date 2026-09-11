"""
Serviço de Pipelines e Stages: regras de negócio.
"""

from fastapi import HTTPException, status

from app.domains.pipelines.entities import (
    Pipeline,
    PipelineCreate,
    PipelineUpdate,
    PipelineWithStages,
    Stage,
    StageCreate,
    StageUpdate,
)
from app.domains.pipelines.repository import PipelineRepository, StageRepository


class PipelineService:
    """Regras de negócio para pipelines."""

    def __init__(
        self,
        pipeline_repo: PipelineRepository | None = None,
        stage_repo: StageRepository | None = None,
    ):
        self.pipeline_repo = pipeline_repo or PipelineRepository()
        self.stage_repo = stage_repo or StageRepository()

    # --------------------------------------------------------
    # Listagem e busca
    # --------------------------------------------------------

    def list_pipelines(self) -> list[Pipeline]:
        """Lista todos os pipelines."""
        data = self.pipeline_repo.list_all()
        return [Pipeline(**p) for p in data]

    def get_pipeline(self, pipeline_id: str) -> Pipeline:
        """Busca um pipeline por ID ou levanta 404."""
        data = self.pipeline_repo.get_by_id(pipeline_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline não encontrado.",
            )
        return Pipeline(**data)

    def get_pipeline_with_stages(self, pipeline_id: str) -> PipelineWithStages:
        """Busca um pipeline já com suas stages aninhadas."""
        pipeline_data = self.pipeline_repo.get_by_id(pipeline_id)
        if not pipeline_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline não encontrado.",
            )
        stages_data = self.stage_repo.list_by_pipeline(pipeline_id)
        pipeline_data["stages"] = [Stage(**s) for s in stages_data]
        return PipelineWithStages(**pipeline_data)

    # --------------------------------------------------------
    # Criação
    # --------------------------------------------------------

    def create_pipeline(self, payload: PipelineCreate) -> Pipeline:
        """Cria um novo pipeline."""
        data = payload.model_dump()

        # Regra: só pode existir um pipeline default.
        if data.get("is_default"):
            self.pipeline_repo.clear_default_flag()

        created = self.pipeline_repo.create(data)
        return Pipeline(**created)

    # --------------------------------------------------------
    # Atualização
    # --------------------------------------------------------

    def update_pipeline(
        self, pipeline_id: str, payload: PipelineUpdate
    ) -> Pipeline:
        """Atualiza um pipeline existente."""
        # Confirma existência
        self.get_pipeline(pipeline_id)

        data = payload.model_dump(exclude_unset=True, exclude_none=True)

        # Regra: só pode existir um pipeline default.
        if data.get("is_default") is True:
            self.pipeline_repo.clear_default_flag(except_id=pipeline_id)

        updated = self.pipeline_repo.update(pipeline_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline não encontrado.",
            )
        return Pipeline(**updated)

    # --------------------------------------------------------
    # Remoção
    # --------------------------------------------------------

    def delete_pipeline(self, pipeline_id: str) -> None:
        """Remove um pipeline e todas as suas stages (via CASCADE do banco)."""
        # Confirma existência
        self.get_pipeline(pipeline_id)
        # O FK está configurado com ON DELETE CASCADE, então as stages somem juntas.
        deleted = self.pipeline_repo.delete(pipeline_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline não encontrado.",
            )


class StageService:
    """Regras de negócio para stages."""

    def __init__(
        self,
        stage_repo: StageRepository | None = None,
        pipeline_repo: PipelineRepository | None = None,
    ):
        self.stage_repo = stage_repo or StageRepository()
        self.pipeline_repo = pipeline_repo or PipelineRepository()

    # --------------------------------------------------------
    # Listagem e busca
    # --------------------------------------------------------

    def list_stages(self, pipeline_id: str) -> list[Stage]:
        """Lista stages de um pipeline."""
        # Confirma que o pipeline existe
        if not self.pipeline_repo.get_by_id(pipeline_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline não encontrado.",
            )
        data = self.stage_repo.list_by_pipeline(pipeline_id)
        return [Stage(**s) for s in data]

    def get_stage(self, stage_id: str) -> Stage:
        """Busca uma stage por ID ou levanta 404."""
        data = self.stage_repo.get_by_id(stage_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage não encontrada.",
            )
        return Stage(**data)

    # --------------------------------------------------------
    # Criação
    # --------------------------------------------------------

    def create_stage(self, pipeline_id: str, payload: StageCreate) -> Stage:
        """Cria uma nova stage em um pipeline."""
        # Confirma que o pipeline existe
        if not self.pipeline_repo.get_by_id(pipeline_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pipeline não encontrado.",
            )

        # Regra: uma stage não pode ser 'won' e 'lost' ao mesmo tempo.
        if payload.is_won and payload.is_lost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uma stage não pode ser 'won' e 'lost' ao mesmo tempo.",
            )

        # Regra: só pode existir uma stage 'won' por pipeline.
        if payload.is_won and self.stage_repo.get_won_stage(pipeline_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este pipeline já possui uma stage de ganho ('won').",
            )

        # Regra: só pode existir uma stage 'lost' por pipeline.
        if payload.is_lost and self.stage_repo.get_lost_stage(pipeline_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Este pipeline já possui uma stage de perda ('lost').",
            )

        data = payload.model_dump()
        data["pipeline_id"] = pipeline_id

        created = self.stage_repo.create(data)
        return Stage(**created)

    # --------------------------------------------------------
    # Atualização
    # --------------------------------------------------------

    def update_stage(self, stage_id: str, payload: StageUpdate) -> Stage:
        """Atualiza uma stage existente."""
        existing = self.get_stage(stage_id)
        data = payload.model_dump(exclude_unset=True, exclude_none=True)

        # Regra: uma stage não pode ser 'won' e 'lost' ao mesmo tempo.
        # Combina os valores atuais com os que estão sendo enviados.
        new_is_won = data.get("is_won", existing.is_won)
        new_is_lost = data.get("is_lost", existing.is_lost)
        if new_is_won and new_is_lost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uma stage não pode ser 'won' e 'lost' ao mesmo tempo.",
            )

        # Regra: só pode existir uma stage 'won' por pipeline.
        if data.get("is_won") is True:
            other_won = self.stage_repo.get_won_stage(existing.pipeline_id)
            if other_won and other_won["id"] != stage_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este pipeline já possui uma stage de ganho ('won').",
                )

        # Regra: só pode existir uma stage 'lost' por pipeline.
        if data.get("is_lost") is True:
            other_lost = self.stage_repo.get_lost_stage(existing.pipeline_id)
            if other_lost and other_lost["id"] != stage_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este pipeline já possui uma stage de perda ('lost').",
                )

        updated = self.stage_repo.update(stage_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage não encontrada.",
            )
        return Stage(**updated)

    # --------------------------------------------------------
    # Remoção
    # --------------------------------------------------------

    def delete_stage(self, stage_id: str) -> None:
        """Remove uma stage."""
        existing = self.get_stage(stage_id)

        # Regra: não permitir deletar a última stage de um pipeline.
        total = self.stage_repo.count_by_pipeline(existing.pipeline_id)
        if total <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível deletar a última stage de um pipeline.",
            )

        deleted = self.stage_repo.delete(stage_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stage não encontrada.",
            )