"""
Router HTTP do domínio de Webhooks.
"""

from fastapi import APIRouter, Depends, Query, status

from app.domains.webhooks.entities import (
    Webhook,
    WebhookCreate,
    WebhookDelivery,
    WebhookUpdate,
)
from app.domains.webhooks.service import WebhookService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/webhooks",
    tags=["Webhooks"],
)


def get_webhook_service() -> WebhookService:
    return WebhookService()


# ============================================================
# CRUD
# ============================================================


@router.get("", response_model=list[Webhook])
def list_webhooks(
    current: CurrentUser = Depends(get_current_user_with_role),
    service: WebhookService = Depends(get_webhook_service),
) -> list[Webhook]:
    """Lista os webhooks do usuário logado."""
    return service.list_webhooks(current)


@router.post("", response_model=Webhook, status_code=status.HTTP_201_CREATED)
def create_webhook(
    payload: WebhookCreate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: WebhookService = Depends(get_webhook_service),
) -> Webhook:
    """Cria um novo webhook."""
    return service.create_webhook(payload, current)


@router.get("/{webhook_id}", response_model=Webhook)
def get_webhook(
    webhook_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: WebhookService = Depends(get_webhook_service),
) -> Webhook:
    """Retorna um webhook específico."""
    return service.get_webhook(webhook_id, current)


@router.patch("/{webhook_id}", response_model=Webhook)
def update_webhook(
    webhook_id: str,
    payload: WebhookUpdate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: WebhookService = Depends(get_webhook_service),
) -> Webhook:
    """Atualiza um webhook."""
    return service.update_webhook(webhook_id, payload, current)


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_webhook(
    webhook_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: WebhookService = Depends(get_webhook_service),
) -> None:
    """Remove um webhook."""
    service.delete_webhook(webhook_id, current)


# ============================================================
# Secret rotation
# ============================================================


@router.post("/{webhook_id}/rotate-secret", response_model=Webhook)
def rotate_secret(
    webhook_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: WebhookService = Depends(get_webhook_service),
) -> Webhook:
    """Gera um novo secret para o webhook."""
    return service.rotate_secret(webhook_id, current)


# ============================================================
# Deliveries (log)
# ============================================================


@router.get("/{webhook_id}/deliveries", response_model=list[WebhookDelivery])
def list_deliveries(
    webhook_id: str,
    limit: int = Query(50, ge=1, le=200),
    current: CurrentUser = Depends(get_current_user_with_role),
    service: WebhookService = Depends(get_webhook_service),
) -> list[WebhookDelivery]:
    """Lista últimas entregas de um webhook."""
    return service.list_deliveries(webhook_id, current, limit=limit)