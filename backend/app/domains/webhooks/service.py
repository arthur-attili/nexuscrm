"""
Serviço de Webhooks: CRUD e gestão de deliveries.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.domains.webhooks.entities import (
    Webhook,
    WebhookCreate,
    WebhookDelivery,
    WebhookUpdate,
)
from app.domains.webhooks.repository import WebhookRepository
from app.shared.dependencies import CurrentUser


def _generate_secret() -> str:
    """Gera um secret aleatório para assinar os payloads."""
    return secrets.token_urlsafe(32)


class WebhookService:
    """Regras de negócio para webhooks."""

    def __init__(self, repo: WebhookRepository | None = None):
        self.repo = repo or WebhookRepository()

    # --------------------------------------------------------
    # Listar / Buscar
    # --------------------------------------------------------

    def list_webhooks(self, current: CurrentUser) -> list[Webhook]:
        """Lista webhooks do usuário logado."""
        data = self.repo.list_by_owner(current.id)
        return [Webhook(**row) for row in data]

    def get_webhook(
        self, webhook_id: str, current: CurrentUser
    ) -> Webhook:
        """Busca um webhook, validando que pertence ao usuário."""
        row = self.repo.get_by_id(webhook_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook não encontrado.",
            )
        if row["owner_id"] != current.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este webhook.",
            )
        return Webhook(**row)

    # --------------------------------------------------------
    # Criar
    # --------------------------------------------------------

    def create_webhook(
        self, payload: WebhookCreate, current: CurrentUser
    ) -> Webhook:
        """Cria um novo webhook com secret gerado automaticamente."""
        data = {
            "name": payload.name.strip(),
            "url": payload.url.strip(),
            "events": payload.events,
            "is_active": payload.is_active,
            "secret": _generate_secret(),
            "owner_id": current.id,
        }
        created = self.repo.create(data)
        return Webhook(**created)

    # --------------------------------------------------------
    # Atualizar
    # --------------------------------------------------------

    def update_webhook(
        self, webhook_id: str, payload: WebhookUpdate, current: CurrentUser
    ) -> Webhook:
        """Atualiza um webhook."""
        self.get_webhook(webhook_id, current)  # valida acesso

        data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if "name" in data:
            data["name"] = data["name"].strip()
        if "url" in data:
            data["url"] = data["url"].strip()

        if not data:
            return self.get_webhook(webhook_id, current)

        updated = self.repo.update(webhook_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook não encontrado.",
            )
        return Webhook(**updated)

    # --------------------------------------------------------
    # Deletar
    # --------------------------------------------------------

    def delete_webhook(self, webhook_id: str, current: CurrentUser) -> None:
        """Deleta um webhook."""
        self.get_webhook(webhook_id, current)  # valida acesso
        deleted = self.repo.delete(webhook_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook não encontrado.",
            )

    # --------------------------------------------------------
    # Rotacionar secret
    # --------------------------------------------------------

    def rotate_secret(self, webhook_id: str, current: CurrentUser) -> Webhook:
        """Gera um novo secret para o webhook."""
        self.get_webhook(webhook_id, current)
        updated = self.repo.update(
            webhook_id, {"secret": _generate_secret()}
        )
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook não encontrado.",
            )
        return Webhook(**updated)

    # --------------------------------------------------------
    # Deliveries (log de entregas)
    # --------------------------------------------------------

    def list_deliveries(
        self, webhook_id: str, current: CurrentUser, limit: int = 50
    ) -> list[WebhookDelivery]:
        """Lista últimas entregas de um webhook."""
        self.get_webhook(webhook_id, current)  # valida acesso
        data = self.repo.list_deliveries_by_webhook(webhook_id, limit=limit)
        return [WebhookDelivery(**row) for row in data]