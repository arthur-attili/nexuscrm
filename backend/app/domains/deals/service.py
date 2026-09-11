"""
Serviço de Deals: regras de negócio.

Regras implementadas:
- Todo deal tem um lead (validado na criação).
- Um lead pode ter N deals (cenário B).
- Ao criar um deal, o lead é marcado como 'converted'.
- Status: 'open' → 'won'/'lost'. 'won'/'lost' são finais.
- Ao mudar status para 'won': stage auto = is_won, probability = 100.
- Ao mudar status para 'lost': stage auto = is_lost, probability = 0.
- Vendedor vê apenas os seus deals. Admin/gerente veem todos.
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.domains.deals.entities import (
    Deal,
    DealCreate,
    DealList,
    DealUpdate,
)
from app.domains.deals.repository import DealRepository
from app.domains.leads.repository import LeadRepository
from app.domains.pipelines.repository import PipelineRepository, StageRepository
from app.shared.dependencies import CurrentUser


class DealService:
    """Regras de negócio para deals."""

    def __init__(
        self,
        repo: DealRepository | None = None,
        lead_repo: LeadRepository | None = None,
        pipeline_repo: PipelineRepository | None = None,
        stage_repo: StageRepository | None = None,
    ):
        self.repo = repo or DealRepository()
        self.lead_repo = lead_repo or LeadRepository()
        self.pipeline_repo = pipeline_repo or PipelineRepository()
        self.stage_repo = stage_repo or StageRepository()

    # --------------------------------------------------------
    # Helpers de acesso
    # --------------------------------------------------------

    def _ensure_can_access(self, deal_data: dict, current: CurrentUser) -> None:
        """Admin/gerente: sempre. Vendedor: apenas se for o dono."""
        if current.can_see_all_leads:
            return
        if deal_data.get("owner_id") != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este negócio.",
            )

    # --------------------------------------------------------
    # Validações
    # --------------------------------------------------------

    def _validate_lead(self, lead_id: str) -> dict:
        """Garante que o lead existe. Retorna o lead."""
        lead = self.lead_repo.get_by_id(lead_id)
        if not lead:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lead informado não existe.",
            )
        return lead

    def _validate_pipeline_and_stage(
        self, pipeline_id: str, stage_id: str | None
    ) -> None:
        """
        Valida coerência entre pipeline e stage.
        - pipeline precisa existir.
        - se stage informada, precisa existir e pertencer ao pipeline.
        """
        if not self.pipeline_repo.get_by_id(pipeline_id):
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
            if stage["pipeline_id"] != pipeline_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A stage informada não pertence ao pipeline informado.",
                )

    def _get_first_stage(self, pipeline_id: str) -> dict:
        """
        Retorna a primeira stage de um pipeline (menor 'order').
        Usada quando o cliente cria um deal sem informar stage_id.
        """
        stages = self.stage_repo.list_by_pipeline(pipeline_id)
        if not stages:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O pipeline informado não possui stages.",
            )
        return stages[0]

    def _resolve_stage_for_status(
        self, pipeline_id: str, new_status: str
    ) -> dict | None:
        """
        Quando o status muda para 'won' ou 'lost', resolve a stage
        correspondente (is_won / is_lost) do pipeline.

        Retorna a stage ou None se não existir no pipeline.
        """
        if new_status == "won":
            return self.stage_repo.get_won_stage(pipeline_id)
        if new_status == "lost":
            return self.stage_repo.get_lost_stage(pipeline_id)
        return None

    def _validate_status_transition(
        self, current_status: str, new_status: str
    ) -> None:
        """
        'open' pode ir para 'won' ou 'lost'.
        'won' e 'lost' são finais.
        """
        if current_status == new_status:
            return  # idempotente
        if current_status in ("won", "lost"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Um negócio '{current_status}' não pode mudar de status.",
            )

    # --------------------------------------------------------
    # Listagem e busca
    # --------------------------------------------------------

    def list_deals(
        self,
        current: CurrentUser,
        lead_id: str | None = None,
        pipeline_id: str | None = None,
        stage_id: str | None = None,
        status_filter: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> DealList:
        """Lista deals com filtros e paginação."""
        owner_filter = None if current.can_see_all_leads else current.id

        items, total = self.repo.list(
            owner_id=owner_filter,
            lead_id=lead_id,
            pipeline_id=pipeline_id,
            stage_id=stage_id,
            status=status_filter,
            page=page,
            page_size=page_size,
        )

        return DealList(
            items=[Deal(**item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_deal(self, deal_id: str, current: CurrentUser) -> Deal:
        """Busca um deal e valida acesso."""
        data = self.repo.get_by_id(deal_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Negócio não encontrado.",
            )
        self._ensure_can_access(data, current)
        return Deal(**data)

    # --------------------------------------------------------
    # Criação
    # --------------------------------------------------------

    def create_deal(self, payload: DealCreate, current: CurrentUser) -> Deal:
        """Cria um novo deal e marca o lead como 'converted'."""
        data = payload.model_dump(mode="json")

        # Valida lead
        self._validate_lead(data["lead_id"])

        # Valida pipeline
        if not self.pipeline_repo.get_by_id(data["pipeline_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pipeline informado não existe.",
            )

        # Se não informou stage, pega a primeira do pipeline.
        if not data.get("stage_id"):
            first_stage = self._get_first_stage(data["pipeline_id"])
            data["stage_id"] = first_stage["id"]
        else:
            self._validate_pipeline_and_stage(
                data["pipeline_id"], data["stage_id"]
            )

        # Owner é o usuário logado.
        data["owner_id"] = current.id
        # Status sempre inicia como 'open'.
        data["status"] = "open"

        created = self.repo.create(data)

        # Marca o lead como convertido.
        # Usamos update direto no repositório de leads para não acoplar com regras.
        self.lead_repo.update(data["lead_id"], {"status": "converted"})

        return Deal(**created)

    # --------------------------------------------------------
    # Atualização
    # --------------------------------------------------------

    def update_deal(
        self, deal_id: str, payload: DealUpdate, current: CurrentUser
    ) -> Deal:
        """Atualiza um deal existente."""
        existing = self.get_deal(deal_id, current)  # já valida acesso
        data = payload.model_dump(mode="json", exclude_unset=True, exclude_none=True)

        if not data:
            return existing

        # --- Validação de transição de status ---
        if "status" in data:
            self._validate_status_transition(existing.status, data["status"])

        # --- Troca de pipeline exige reavaliar stage ---
        pipeline_id = data.get("pipeline_id", existing.pipeline_id)

        if "pipeline_id" in data:
            # Se trocou o pipeline, valida que ele existe.
            if not self.pipeline_repo.get_by_id(pipeline_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pipeline informado não existe.",
                )

        if "stage_id" in data:
            self._validate_pipeline_and_stage(pipeline_id, data["stage_id"])

        # --- Efeitos automáticos de status ---
        if data.get("status") == "won":
            won_stage = self._resolve_stage_for_status(pipeline_id, "won")
            if won_stage:
                data["stage_id"] = won_stage["id"]
            data["probability"] = 100

        elif data.get("status") == "lost":
            lost_stage = self._resolve_stage_for_status(pipeline_id, "lost")
            if lost_stage:
                data["stage_id"] = lost_stage["id"]
            data["probability"] = 0

        updated = self.repo.update(deal_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Negócio não encontrado.",
            )
        return Deal(**updated)

    # --------------------------------------------------------
    # Remoção
    # --------------------------------------------------------

    def delete_deal(self, deal_id: str, current: CurrentUser) -> None:
        """Remove um deal."""
        self.get_deal(deal_id, current)  # valida acesso
        deleted = self.repo.delete(deal_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Negócio não encontrado.",
            )