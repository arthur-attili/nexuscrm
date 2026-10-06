"""
Repositório de Notas.
"""

from __future__ import annotations

from typing import Optional

from app.core.database import supabase


class NoteRepository:
    """Operações de banco de dados para a tabela 'notes'."""

    TABLE = "notes"

    def list_by_record(
        self, record_type: str, record_id: str
    ) -> list[dict]:
        """
        Lista notas de um lead/deal.
        Ordenação: fixadas primeiro, depois por data (mais recentes primeiro).
        """
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("record_type", record_type)
            .eq("record_id", record_id)
            .order("pinned", desc=True)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []

    def get_by_id(self, note_id: str) -> Optional[dict]:
        """Busca uma nota por ID."""
        response = (
            supabase.table(self.TABLE).select("*").eq("id", note_id).execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def create(self, data: dict) -> dict:
        """Cria uma nova nota."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, note_id: str, data: dict) -> Optional[dict]:
        """Atualiza uma nota existente."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", note_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, note_id: str) -> bool:
        """Deleta uma nota."""
        response = (
            supabase.table(self.TABLE).delete().eq("id", note_id).execute()
        )
        return bool(response.data)

    # --------------------------------------------------------
    # Join com profiles (nome do autor)
    # --------------------------------------------------------

    def get_authors_map(self, author_ids: list[str]) -> dict[str, str]:
        """
        Retorna {user_id: name} para os autores passados.
        Uma query só, evita N+1.
        """
        if not author_ids:
            return {}
        response = (
            supabase.table("profiles")
            .select("id, name")
            .in_("id", author_ids)
            .execute()
        )
        return {row["id"]: row["name"] for row in (response.data or [])}