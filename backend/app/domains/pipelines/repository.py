"""
Repositório de Pipelines e Stages: acesso ao banco via Supabase.
"""

from typing import Optional

from app.core.database import supabase


class PipelineRepository:
    """Operações de banco de dados para a tabela 'pipelines'."""

    TABLE = "pipelines"

    def list_all(self) -> list[dict]:
        """Lista todos os pipelines ordenados por created_at."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .order("created_at", desc=False)
            .execute()
        )
        return response.data or []

    def get_by_id(self, pipeline_id: str) -> Optional[dict]:
        """Busca um pipeline por ID."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("id", pipeline_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def get_default(self) -> Optional[dict]:
        """Retorna o pipeline marcado como default (se existir)."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("is_default", True)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def create(self, data: dict) -> dict:
        """Cria um novo pipeline."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, pipeline_id: str, data: dict) -> Optional[dict]:
        """Atualiza um pipeline existente."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", pipeline_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, pipeline_id: str) -> bool:
        """Deleta um pipeline. Retorna True se algo foi deletado."""
        response = (
            supabase.table(self.TABLE)
            .delete()
            .eq("id", pipeline_id)
            .execute()
        )
        return bool(response.data)

    def clear_default_flag(self, except_id: Optional[str] = None) -> None:
        """
        Remove a flag is_default de todos os pipelines (exceto o informado).
        Usado antes de definir um novo pipeline como default.
        """
        query = supabase.table(self.TABLE).update({"is_default": False}).eq(
            "is_default", True
        )
        if except_id:
            query = query.neq("id", except_id)
        query.execute()


class StageRepository:
    """Operações de banco de dados para a tabela 'stages'."""

    TABLE = "stages"

    def list_by_pipeline(self, pipeline_id: str) -> list[dict]:
        """Lista as stages de um pipeline, ordenadas por 'order'."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("pipeline_id", pipeline_id)
            .order("order", desc=False)
            .execute()
        )
        return response.data or []

    def get_by_id(self, stage_id: str) -> Optional[dict]:
        """Busca uma stage por ID."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("id", stage_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def create(self, data: dict) -> dict:
        """Cria uma nova stage."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, stage_id: str, data: dict) -> Optional[dict]:
        """Atualiza uma stage existente."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", stage_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, stage_id: str) -> bool:
        """Deleta uma stage. Retorna True se algo foi deletado."""
        response = (
            supabase.table(self.TABLE)
            .delete()
            .eq("id", stage_id)
            .execute()
        )
        return bool(response.data)

    def count_by_pipeline(self, pipeline_id: str) -> int:
        """Conta quantas stages existem em um pipeline."""
        response = (
            supabase.table(self.TABLE)
            .select("id", count="exact")
            .eq("pipeline_id", pipeline_id)
            .execute()
        )
        return response.count or 0

    def get_won_stage(self, pipeline_id: str) -> Optional[dict]:
        """Retorna a stage marcada como 'is_won' do pipeline (se existir)."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("pipeline_id", pipeline_id)
            .eq("is_won", True)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def get_lost_stage(self, pipeline_id: str) -> Optional[dict]:
        """Retorna a stage marcada como 'is_lost' do pipeline (se existir)."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("pipeline_id", pipeline_id)
            .eq("is_lost", True)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]