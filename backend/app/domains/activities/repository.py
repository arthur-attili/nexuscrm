"""
Repositório de Atividades.
"""

from __future__ import annotations

from typing import Optional

from app.core.database import supabase


class ActivityRepository:
    """Operações de banco de dados para a tabela 'activities'."""

    TABLE = "activities"

    def list_by_record(
        self, record_type: str, record_id: str
    ) -> list[dict]:
        """
        Lista atividades de um lead/deal.
        Ordenação: pendentes primeiro (por due_date), concluídas por último.
        """
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("record_type", record_type)
            .eq("record_id", record_id)
            .order("completed", desc=False)
            .order("due_date", desc=False, nullsfirst=False)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []

    def get_by_id(self, activity_id: str) -> Optional[dict]:
        """Busca uma atividade por ID."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("id", activity_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def create(self, data: dict) -> dict:
        """Cria uma nova atividade."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, activity_id: str, data: dict) -> Optional[dict]:
        """Atualiza uma atividade existente."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", activity_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, activity_id: str) -> bool:
        """Deleta uma atividade."""
        response = (
            supabase.table(self.TABLE).delete().eq("id", activity_id).execute()
        )
        return bool(response.data)

    # --------------------------------------------------------
    # Join com profiles
    # --------------------------------------------------------

    def get_owners_map(self, owner_ids: list[str]) -> dict[str, str]:
        """Retorna {user_id: name} para os owners passados."""
        if not owner_ids:
            return {}
        response = (
            supabase.table("profiles")
            .select("id, name")
            .in_("id", owner_ids)
            .execute()
        )
        return {row["id"]: row["name"] for row in (response.data or [])}