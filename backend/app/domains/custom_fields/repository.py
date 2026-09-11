"""
Repositório de Custom Fields: acesso ao banco via Supabase.
"""

from typing import Optional

from app.core.database import supabase


class CustomFieldRepository:
    """Operações de banco de dados para a tabela 'custom_fields'."""

    TABLE = "custom_fields"

    def list(
        self,
        target: Optional[str] = None,
    ) -> list[dict]:
        """
        Lista custom fields, opcionalmente filtrando por target ('lead' ou 'deal').
        Ordenados por created_at ascendente (ordem de criação).
        """
        query = supabase.table(self.TABLE).select("*")
        if target:
            query = query.eq("target", target)
        query = query.order("created_at", desc=False)
        response = query.execute()
        return response.data or []

    def get_by_id(self, field_id: str) -> Optional[dict]:
        """Busca um custom field por ID."""
        response = (
            supabase.table(self.TABLE).select("*").eq("id", field_id).execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def get_by_name_and_target(
        self, name: str, target: str
    ) -> Optional[dict]:
        """
        Busca um custom field pelo nome + target.
        Usado para garantir unicidade de nome dentro de cada target.
        """
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("name", name)
            .eq("target", target)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def create(self, data: dict) -> dict:
        """Cria um novo custom field."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, field_id: str, data: dict) -> Optional[dict]:
        """Atualiza um custom field existente."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", field_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, field_id: str) -> bool:
        """Deleta um custom field. Retorna True se algo foi deletado."""
        response = (
            supabase.table(self.TABLE).delete().eq("id", field_id).execute()
        )
        return bool(response.data)