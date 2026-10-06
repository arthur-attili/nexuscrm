"""
Repositório de API Keys.
"""

from __future__ import annotations

from typing import Optional

from app.core.database import supabase


class ApiKeyRepository:
    """Operações de banco de dados para a tabela 'api_keys'."""

    TABLE = "api_keys"

    def create(self, data: dict) -> dict:
        """Cria uma nova API key."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def list_by_owner(self, owner_id: str) -> list[dict]:
        """Lista as API keys de um usuário, mais recentes primeiro."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("owner_id", owner_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []

    def get_by_id(self, key_id: str) -> Optional[dict]:
        """Busca uma API key por ID."""
        response = (
            supabase.table(self.TABLE).select("*").eq("id", key_id).execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def get_by_hash(self, key_hash: str) -> Optional[dict]:
        """Busca uma API key pelo hash (usado na autenticação)."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("key_hash", key_hash)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def update_last_used(self, key_id: str, when: str) -> None:
        """Atualiza o campo last_used_at. Silencioso — erros são ignorados."""
        try:
            supabase.table(self.TABLE).update(
                {"last_used_at": when}
            ).eq("id", key_id).execute()
        except Exception:
            # Não queremos que falha em tracking quebre a requisição
            pass

    def delete(self, key_id: str) -> bool:
        """Deleta uma API key."""
        response = (
            supabase.table(self.TABLE).delete().eq("id", key_id).execute()
        )
        return bool(response.data)