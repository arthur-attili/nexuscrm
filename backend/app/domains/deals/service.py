"""
Serviço de Deals: regras de negócio.
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.domains.custom_fields.validator import CustomFieldValidator
from app.domains.deals.entities import (
    Deal,
    DealCreate,
    DealList,
    DealUpdate,
)
from app.domains.deals.repository import DealRepository
from app.domains.leads.repository import LeadRepository
from app.domains.pipelines.repository import PipelineRepository, StageRepository
from app.domains.webhooks.dispatcher import dispatch_event
from app.shared.dependencies import CurrentUser


class DealService:
    """Regras de negócio para deals."""

    def __init__(
        self,
        repo: DealRepository | None = None,
        lead_repo: LeadRepository | None = None,
        pipeline_repo: PipelineRepository | None = None,
        stage_repo: StageRepository | None = None,
        custom_validator: CustomFieldValidator | None = None,
    ):
        self.repo = repo or DealRepository()
        self.lead_repo = lead_repo or LeadRepository()
        self.pipeline_repo = pipeline_repo or PipelineRepository()
        self.stage_repo = stage_repo or StageRepository()
        self.custom_validator = custom_validator or CustomFieldValidator()

    # --------------------------------------------------------
    # Helpers
    # --------------------------------------------------------

    def _ensure_can_access(self, deal_data: dict, current: CurrentUser) -> None:
        if current.can_see_all_leads:
            return
        if deal_data.get("owner_id") != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este negócio.",
            )

    def _validate_lead(self, lead_id: str) -> dict:
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
        if new_status == "won":
            return self.stage_repo.get_won_stage(pipeline_id)
        if new_status == "lost":
            return self.stage_repo.get_lost_stage(pipeline_id)
        return None

    def _validate_status_transition(
        self, current_status: str, new_status: str
    ) -> None:
        if current_status == new_status:
            return
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
        data = payload.model_dump(mode="json")

        data["custom_values"] = self.custom_validator.validate(
            "deal", data.get("custom_values") or {}
        )

        self._validate_lead(data["lead_id"])

        if not self.pipeline_repo.get_by_id(data["pipeline_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pipeline informado não existe.",
            )

        if not data.get("stage_id"):
            first_stage = self._get_first_stage(data["pipeline_id"])
            data["stage_id"] = first_stage["id"]
        else:
            self._validate_pipeline_and_stage(
                data["pipeline_id"], data["stage_id"]
            )

        data["owner_id"] = current.id
        data["status"] = "open"

        created = self.repo.create(data)
        self.lead_repo.update(data["lead_id"], {"status": "converted"})

        deal = Deal(**created)

        # Dispara webhook
        dispatch_event(
            owner_id=current.id,
            event="deal.created",
            payload={
                "id": deal.id,
                "lead_id": deal.lead_id,
                "lead_name": deal.lead_name,
                "value": str(deal.value),
                "status": deal.status,
                "stage_id": deal.stage_id,
                "pipeline_id": deal.pipeline_id,
                "owner_id": deal.owner_id,
                "created_at": deal.created_at.isoformat() if deal.created_at else None,
            },
        )

        return deal

    # --------------------------------------------------------
    # Atualização
    # --------------------------------------------------------

    def update_deal(
        self, deal_id: str, payload: DealUpdate, current: CurrentUser
    ) -> Deal:
        existing = self.get_deal(deal_id, current)
        data = payload.model_dump(
            mode="json", exclude_unset=True, exclude_none=True
        )

        if not data:
            return existing

        if "custom_values" in data:
            data["custom_values"] = self.custom_validator.validate(
                "deal", data["custom_values"] or {}
            )

        if "status" in data:
            self._validate_status_transition(existing.status, data["status"])

        pipeline_id = data.get("pipeline_id", existing.pipeline_id)

        if "pipeline_id" in data:
            if not self.pipeline_repo.get_by_id(pipeline_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pipeline informado não existe.",
                )

        if "stage_id" in data:
            self._validate_pipeline_and_stage(pipeline_id, data["stage_id"])

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
        deal = Deal(**updated)

        # Dispara webhook (deal.updated)
        dispatch_event(
            owner_id=current.id,
            event="deal.updated",
            payload={
                "id": deal.id,
                "lead_id": deal.lead_id,
                "lead_name": deal.lead_name,
                "status": deal.status,
                "value": str(deal.value),
                "stage_id": deal.stage_id,
                "updated_fields": list(data.keys()),
            },
        )

        # Dispara webhook adicional quando o status mudou
        if "status" in data and data["status"] != existing.status:
            dispatch_event(
                owner_id=current.id,
                event="deal.status_changed",
                payload={
                    "id": deal.id,
                    "lead_id": deal.lead_id,
                    "lead_name": deal.lead_name,
                    "from_status": existing.status,
                    "to_status": deal.status,
                    "value": str(deal.value),
                },
            )

        return deal

    # --------------------------------------------------------
    # Remoção
    # --------------------------------------------------------

    def delete_deal(self, deal_id: str, current: CurrentUser) -> None:
        self.get_deal(deal_id, current)
        deleted = self.repo.delete(deal_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Negócio não encontrado.",
            )