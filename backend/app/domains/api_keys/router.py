"""
Router HTTP do domínio de API Keys.
"""

from fastapi import APIRouter, Depends, status

from app.domains.api_keys.entities import (
    ApiKey,
    ApiKeyCreate,
    ApiKeyCreated,
)
from app.domains.api_keys.service import ApiKeyService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/api-keys",
    tags=["API Keys"],
)


def get_api_key_service() -> ApiKeyService:
    return ApiKeyService()


@router.get("", response_model=list[ApiKey])
def list_api_keys(
    current: CurrentUser = Depends(get_current_user_with_role),
    service: ApiKeyService = Depends(get_api_key_service),
) -> list[ApiKey]:
    """Lista as API keys do usuário logado."""
    return service.list_keys(current)


@router.post(
    "", response_model=ApiKeyCreated, status_code=status.HTTP_201_CREATED
)
def create_api_key(
    payload: ApiKeyCreate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: ApiKeyService = Depends(get_api_key_service),
) -> ApiKeyCreated:
    """
    Cria uma nova API key.

    ⚠️ O token completo SÓ é retornado nesta resposta. Guarde-o!
    """
    return service.create_key(payload, current)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    key_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: ApiKeyService = Depends(get_api_key_service),
) -> None:
    """Revoga (deleta) uma API key."""
    service.delete_key(key_id, current)