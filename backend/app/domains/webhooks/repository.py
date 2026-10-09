"""
Repositório de Webhooks.
"""

from __future__ import annotations

from typing import Optional

from app.core.database import supabase


class WebhookRepository:
    """Operações de banco de dados para 'webhooks' e 'webhook_deliveries'."""

    TABLE = "webhooks"
    DELIVERIES_TABLE = "webhook_deliveries"

    # --------------------------------------------------------
    # Webhooks
    # --------------------------------------------------------

    def list_by_owner(self, owner_id: str) -> list[dict]:
        """Lista webhooks de um usuário."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("owner_id", owner_id)
            .order("created_at", desc=True)
            .execute()
        )
        return response.data or []

    def get_by_id(self, webhook_id: str) -> Optional[dict]:
        """Busca um webhook por ID."""
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("id", webhook_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def list_active_by_owner_and_event(
        self, owner_id: str, event: str
    ) -> list[dict]:
        """
        Lista webhooks ativos de um usuário que escutam um evento específico.
        Usa array contains do PostgREST: `events @> ARRAY['lead.created']`.
        """
        response = (
            supabase.table(self.TABLE)
            .select("*")
            .eq("owner_id", owner_id)
            .eq("is_active", True)
            .contains("events", [event])
            .execute()
        )
        return response.data or []

    def create(self, data: dict) -> dict:
        """Cria um novo webhook."""
        response = supabase.table(self.TABLE).insert(data).execute()
        return response.data[0]

    def update(self, webhook_id: str, data: dict) -> Optional[dict]:
        """Atualiza um webhook."""
        response = (
            supabase.table(self.TABLE)
            .update(data)
            .eq("id", webhook_id)
            .execute()
        )
        if not response.data:
            return None
        return response.data[0]

    def delete(self, webhook_id: str) -> bool:
        """Deleta um webhook (e suas deliveries via CASCADE)."""
        response = (
            supabase.table(self.TABLE).delete().eq("id", webhook_id).execute()
        )
        return bool(response.data)

    # --------------------------------------------------------
    # Deliveries
    # --------------------------------------------------------

    def create_delivery(self, data: dict) -> dict:
        """Cria um registro de entrega."""
        response = supabase.table(self.DELIVERIES_TABLE).insert(data).execute()
        return response.data[0]

    def update_delivery(self, delivery_id: str, data: dict) -> None:
        """Atualiza um registro de entrega. Silencioso — erros são logados."""
        try:
            supabase.table(self.DELIVERIES_TABLE).update(data).eq(
                "id", delivery_id
            ).execute()
        except Exception as e:
            print(f"[webhooks] Erro ao atualizar delivery {delivery_id}: {e}")

    def list_deliveries_by_webhook(
        self, webhook_id: str, limit: int = 50
    ) -> list[dict]:
        """Lista últimas entregas de um webhook."""
        response = (
            supabase.table(self.DELIVERIES_TABLE)
            .select("*")
            .eq("webhook_id", webhook_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data or []