"""
Repositório de Deals: acesso ao banco via Supabase.
"""

from __future__ import annotations

from typing import Optional

from app.core.database import supabase


class DealRepository:
    """Operações de banco de dados para a tabela 'deals'."""

    TABLE = "deals"

    def list(
        self,
        owner_id: Optional[str] = None,
        lead_id: Optional[str] = None,
        pipeline_id: Optional[str] = None,
        stage_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        """
        Lista deals com filtros opcionais e paginação.

        Retorna (items, total).
        """
        query = supabase.table(self.TABLE).select("*", count="exact")

        if owner_id:
            query = query.eq("owner_id", owner_id)
        if lead_id:
            query = query.eq("lead_id", lead_id)
        if pipeline_id:
            query = query.eq("pipeline_id", pipeline_id)
        if stage_id:
            query = query.eq("stage_id", stage_id)
        if status:
            query = query.eq("status", status)

        query = query.order("created_at", desc=True)

        start = (page - 1) * page_size
        end = start + page_size - 1
        query = query.range(start, end)

        response = query.execute()
        return response.data or [], response.count or 0

    def get_by_id(self, deal_id: str) -> Optional[dict]:
        """Busca um deal por ID."""
        response = (
            supabase.table(self.TABLE).select("*").eq("id", deal_id).execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def get_by_lead(self, lead_id: str) -> list[dict]:
        """
        Lista deals de um lead específico.
        Usado para verificar se o lead já tem deal (regra de negócio).
        """
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("lead_id", lead_id)
            .execute()
        )
        return response.data or []

    def create(self, data: dict) -> dict:
        """Cria um novo deal."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, deal_id: str, data: dict) -> Optional[dict]:
        """Atualiza um deal existente."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", deal_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, deal_id: str) -> bool:
        """Deleta um deal. Retorna True se algo foi deletado."""
        response = (
            supabase.table(self.TABLE).delete().eq("id", deal_id).execute()
        )
        return bool(response.data)