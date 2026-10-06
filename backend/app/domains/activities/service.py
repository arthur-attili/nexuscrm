"""
Serviço de Atividades: regras de negócio.

Regras de acesso:
- Vendedor: só vê/edita atividades de leads/deals que ele é dono.
- Gerente/admin: veem tudo.

Regras de edição:
- Qualquer usuário com acesso ao registro pode editar atividades dele
  (atividades são compartilhadas entre a equipe — diferente de notas,
  que só o autor edita).
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.domains.activities.entities import (
    Activity,
    ActivityCreate,
    ActivityUpdate,
)
from app.domains.activities.repository import ActivityRepository
from app.domains.deals.repository import DealRepository
from app.domains.leads.repository import LeadRepository
from app.shared.dependencies import CurrentUser


class ActivityService:
    """Regras de negócio para atividades."""

    def __init__(
        self,
        repo: ActivityRepository | None = None,
        lead_repo: LeadRepository | None = None,
        deal_repo: DealRepository | None = None,
    ):
        self.repo = repo or ActivityRepository()
        self.lead_repo = lead_repo or LeadRepository()
        self.deal_repo = deal_repo or DealRepository()

    # --------------------------------------------------------
    # Helpers
    # --------------------------------------------------------

    def _get_record(self, record_type: str, record_id: str) -> dict:
        """Busca o lead ou o deal referenciado. 404 se não existir."""
        if record_type == "lead":
            record = self.lead_repo.get_by_id(record_id)
            label = "Lead"
        elif record_type == "deal":
            record = self.deal_repo.get_by_id(record_id)
            label = "Negócio"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tipo de registro inválido.",
            )

        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"{label} não encontrado.",
            )
        return record

    def _ensure_can_access(self, record: dict, current: CurrentUser) -> None:
        """Admin/gerente: sempre. Vendedor: apenas se for o dono."""
        if current.can_see_all_leads:
            return
        if record.get("owner_id") != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar atividades deste registro.",
            )

    # --------------------------------------------------------
    # Enriquecimento
    # --------------------------------------------------------

    def _enrich_with_owner(self, activity: dict) -> Activity:
        owner_id = activity.get("owner_id")
        name_map = self.repo.get_owners_map([owner_id]) if owner_id else {}
        activity["owner_name"] = name_map.get(owner_id)
        return Activity(**activity)

    def _enrich_many(self, activities: list[dict]) -> list[Activity]:
        owner_ids = list(
            {a.get("owner_id") for a in activities if a.get("owner_id")}
        )
        name_map = self.repo.get_owners_map(owner_ids)
        for a in activities:
            a["owner_name"] = name_map.get(a.get("owner_id"))
        return [Activity(**a) for a in activities]

    # --------------------------------------------------------
    # Listar
    # --------------------------------------------------------

    def list_activities(
        self,
        record_type: str,
        record_id: str,
        current: CurrentUser,
    ) -> list[Activity]:
        """Lista atividades de um lead/deal."""
        record = self._get_record(record_type, record_id)
        self._ensure_can_access(record, current)
        data = self.repo.list_by_record(record_type, record_id)
        return self._enrich_many(data)

    # --------------------------------------------------------
    # Criar
    # --------------------------------------------------------

    def create_activity(
        self, payload: ActivityCreate, current: CurrentUser
    ) -> Activity:
        """Cria uma atividade."""
        record = self._get_record(payload.record_type, payload.record_id)
        self._ensure_can_access(record, current)

        data = {
            "record_type": payload.record_type,
            "record_id": payload.record_id,
            "type": payload.type,
            "description": (
                payload.description.strip() if payload.description else None
            ),
            "due_date": (
                payload.due_date.isoformat() if payload.due_date else None
            ),
            "completed": False,
            "owner_id": current.id,
        }

        created = self.repo.create(data)
        return self._enrich_with_owner(created)

    # --------------------------------------------------------
    # Atualizar
    # --------------------------------------------------------

    def update_activity(
        self, activity_id: str, payload: ActivityUpdate, current: CurrentUser
    ) -> Activity:
        """Atualiza uma atividade."""
        existing = self.repo.get_by_id(activity_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Atividade não encontrada.",
            )

        record = self._get_record(
            existing["record_type"], existing["record_id"]
        )
        self._ensure_can_access(record, current)

        data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "description" in data:
            data["description"] = data["description"].strip() or None
        if "due_date" in data and data["due_date"] is not None:
            data["due_date"] = data["due_date"].isoformat()

        if not data:
            return self._enrich_with_owner(existing)

        updated = self.repo.update(activity_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Atividade não encontrada.",
            )
        return self._enrich_with_owner(updated)

    # --------------------------------------------------------
    # Deletar
    # --------------------------------------------------------

    def delete_activity(self, activity_id: str, current: CurrentUser) -> None:
        """Deleta uma atividade."""
        existing = self.repo.get_by_id(activity_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Atividade não encontrada.",
            )

        record = self._get_record(
            existing["record_type"], existing["record_id"]
        )
        self._ensure_can_access(record, current)

        deleted = self.repo.delete(activity_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Atividade não encontrada.",
            )