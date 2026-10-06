"""
Serviço de Leads: regras de negócio.
"""

from fastapi import HTTPException, status

from app.domains.custom_fields.validator import CustomFieldValidator
from app.domains.leads.entities import (
    Lead,
    LeadCreate,
    LeadList,
    LeadUpdate,
)
from app.domains.leads.repository import LeadRepository
from app.domains.pipelines.repository import PipelineRepository, StageRepository
from app.shared.dependencies import CurrentUser


class LeadService:
    """Regras de negócio para leads."""

    def __init__(
        self,
        repo: LeadRepository | None = None,
        pipeline_repo: PipelineRepository | None = None,
        stage_repo: StageRepository | None = None,
        custom_validator: CustomFieldValidator | None = None,
    ):
        self.repo = repo or LeadRepository()
        self.pipeline_repo = pipeline_repo or PipelineRepository()
        self.stage_repo = stage_repo or StageRepository()
        self.custom_validator = custom_validator or CustomFieldValidator()

    # --------------------------------------------------------
    # Helpers de acesso
    # --------------------------------------------------------

    def _ensure_can_access(self, lead_data: dict, current: CurrentUser) -> None:
        """
        Verifica se o usuário pode ver/editar um lead específico.
        - Admin/Gerente: sempre.
        - Vendedor: apenas se for o dono.
        """
        if current.can_see_all_leads:
            return
        if lead_data.get("owner_id") != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este lead.",
            )

    # --------------------------------------------------------
    # Validações de pipeline/stage
    # --------------------------------------------------------

    def _validate_pipeline_and_stage(self, data: dict) -> None:
        """
        Valida coerência entre pipeline_id e stage_id.

        Regras:
        - Se pipeline_id informado, precisa existir.
        - Se stage_id informado, precisa existir.
        - Se ambos informados, a stage precisa pertencer ao pipeline.
        """
        pipeline_id = data.get("pipeline_id")
        stage_id = data.get("stage_id")

        if pipeline_id and not self.pipeline_repo.get_by_id(pipeline_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pipeline informado não existe.",
            )

        if stage_id:
            stage = self.stage_repo.get_by_id(stage_id)
            if not stage:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Stage informada não existe.",
                )
            if pipeline_id and stage["pipeline_id"] != pipeline_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A stage informada não pertence ao pipeline informado.",
                )

    # --------------------------------------------------------
    # Listagem
    # --------------------------------------------------------

    def list_leads(
        self,
        current: CurrentUser,
        pipeline_id: str | None = None,
        stage_id: str | None = None,
        status_filter: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> LeadList:
        """
        Lista leads com filtros e paginação.

        Vendedor: vê apenas os seus. Admin/Gerente: veem todos.
        """
        owner_filter = None if current.can_see_all_leads else current.id

        items, total = self.repo.list(
            owner_id=owner_filter,
            pipeline_id=pipeline_id,
            stage_id=stage_id,
            status=status_filter,
            search=search,
            page=page,
            page_size=page_size,
        )

        return LeadList(
            items=[Lead(**item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    # --------------------------------------------------------
    # Busca individual
    # --------------------------------------------------------

    def get_lead(self, lead_id: str, current: CurrentUser) -> Lead:
        """Busca um lead e valida acesso."""
        data = self.repo.get_by_id(lead_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead não encontrado.",
            )
        self._ensure_can_access(data, current)
        return Lead(**data)

    # --------------------------------------------------------
    # Criação
    # --------------------------------------------------------

    def create_lead(self, payload: LeadCreate, current: CurrentUser) -> Lead:
        """Cria um novo lead com owner_id = usuário logado."""
        data = payload.model_dump(mode="json")

        # Valida e normaliza custom_values contra os custom_fields definidos.
        data["custom_values"] = self.custom_validator.validate(
            "lead", data.get("custom_values") or {}
        )

        # O dono é SEMPRE o usuário autenticado, nunca o cliente.
        data["owner_id"] = current.id

        # Valida pipeline/stage, se informados.
        self._validate_pipeline_and_stage(data)

        created = self.repo.create(data)
        return Lead(**created)

    # --------------------------------------------------------
    # Atualização
    # --------------------------------------------------------

    def update_lead(
        self, lead_id: str, payload: LeadUpdate, current: CurrentUser
    ) -> Lead:
        """Atualiza um lead existente."""
        # get_lead já valida acesso.
        self.get_lead(lead_id, current)

        data = payload.model_dump(
            mode="json", exclude_unset=True, exclude_none=True
        )

        # Valida custom_values se foram informados.
        if "custom_values" in data:
            data["custom_values"] = self.custom_validator.validate(
                "lead", data["custom_values"] or {}
            )

        # Valida pipeline/stage se algum dos dois foi informado.
        if "pipeline_id" in data or "stage_id" in data:
            self._validate_pipeline_and_stage(data)

        updated = self.repo.update(lead_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead não encontrado.",
            )
        return Lead(**updated)

    # --------------------------------------------------------
    # Remoção
    # --------------------------------------------------------

    def delete_lead(self, lead_id: str, current: CurrentUser) -> None:
        """Remove um lead."""
        # get_lead já valida acesso.
        self.get_lead(lead_id, current)
        deleted = self.repo.delete(lead_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lead não encontrado.",
            )