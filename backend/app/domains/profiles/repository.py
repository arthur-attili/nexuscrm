"""
Repositório de Perfis: acesso ao banco via Supabase.
"""

from typing import Optional

from app.core.database import supabase


class ProfileRepository:
    """Operações de banco de dados para a tabela 'profiles'."""

    TABLE = "profiles"

    def get_by_id(self, user_id: str) -> Optional[dict]:
        """Busca um perfil por ID. Retorna None se não existir."""
        response = supabase.table(self.TABLE).select("*").eq("id", user_id).execute()
        if not response.data:
            return None
        return response.data[0]

    def update(self, user_id: str, data: dict) -> Optional[dict]:
        """Atualiza um perfil e retorna o registro atualizado."""
        response = supabase.table(self.TABLE).update(data).eq("id", user_id).execute()
        if not response.data:
            return None
        return response.data[0]