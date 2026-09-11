"""
Repositório de Leads: acesso ao banco via Supabase.
"""

from typing import Optional

from app.core.database import supabase


class LeadRepository:
    """Operações de banco de dados para a tabela 'leads'."""

    TABLE = "leads"

    def list(
        self,
        owner_id: Optional[str] = None,
        pipeline_id: Optional[str] = None,
        stage_id: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict], int]:
        """
        Lista leads com filtros opcionais e paginação.

        Retorna uma tupla (items, total), onde:
        - items: lista de dicts (formato bruto do Supabase) da página solicitada.
        - total: número total de leads que batem com os filtros (sem paginação).
        """
        query = supabase.table(self.TABLE).select("*", count="exact")

        # --- Filtros opcionais ---
        if owner_id:
            query = query.eq("owner_id", owner_id)
        if pipeline_id:
            query = query.eq("pipeline_id", pipeline_id)
        if stage_id:
            query = query.eq("stage_id", stage_id)
        if status:
            query = query.eq("status", status)
        if search:
            # Busca por nome (case-insensitive). Supabase usa ILIKE via .ilike()
            query = query.ilike("name", f"%{search}%")

        # --- Ordenação padrão ---
        query = query.order("created_at", desc=True)

        # --- Paginação (range inclusivo) ---
        start = (page - 1) * page_size
        end = start + page_size - 1
        query = query.range(start, end)

        response = query.execute()

        return response.data or [], response.count or 0

    def get_by_id(self, lead_id: str) -> Optional[dict]:
        """Busca um lead por ID."""
        response = (
            supabase.table(self.TABLE).select("*").eq("id", lead_id).execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def create(self, data: dict) -> dict:
        """Cria um novo lead."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, lead_id: str, data: dict) -> Optional[dict]:
        """Atualiza um lead existente."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", lead_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, lead_id: str) -> bool:
        """Deleta um lead. Retorna True se algo foi deletado."""
        response = (
            supabase.table(self.TABLE).delete().eq("id", lead_id).execute()
        )
        return bool(response.data)