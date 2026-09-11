"""
Router HTTP do domínio de Custom Fields.
"""

from fastapi import APIRouter, Depends, Query, status

from app.domains.custom_fields.entities import (
    CustomField,
    CustomFieldCreate,
    CustomFieldUpdate,
)
from app.domains.custom_fields.service import CustomFieldService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/custom-fields",
    tags=["Custom Fields"],
)


def get_custom_field_service() -> CustomFieldService:
    """Injeção de dependência do service."""
    return CustomFieldService()


# ============================================================
# Listagem
# ============================================================


@router.get("", response_model=list[CustomField])
def list_custom_fields(
    target: str | None = Query(
        None,
        description="Filtrar por target: 'lead' ou 'deal'",
    ),
    current: CurrentUser = Depends(get_current_user_with_role),
    service: CustomFieldService = Depends(get_custom_field_service),
) -> list[CustomField]:
    """Lista custom fields (opcionalmente filtrando por target)."""
    return service.list_fields(current, target=target)


# ============================================================
# Criação (admin)
# ============================================================


@router.post(
    "",
    response_model=CustomField,
    status_code=status.HTTP_201_CREATED,
)
def create_custom_field(
    payload: CustomFieldCreate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: CustomFieldService = Depends(get_custom_field_service),
) -> CustomField:
    """Cria um novo custom field (apenas admin)."""
    return service.create_field(payload, current)


# ============================================================
# Busca individual
# ============================================================


@router.get("/{field_id}", response_model=CustomField)
def get_custom_field(
    field_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: CustomFieldService = Depends(get_custom_field_service),
) -> CustomField:
    """Retorna um custom field específico."""
    return service.get_field(field_id, current)


# ============================================================
# Atualização (admin)
# ============================================================


@router.patch("/{field_id}", response_model=CustomField)
def update_custom_field(
    field_id: str,
    payload: CustomFieldUpdate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: CustomFieldService = Depends(get_custom_field_service),
) -> CustomField:
    """Atualiza um custom field (apenas admin)."""
    return service.update_field(field_id, payload, current)


# ============================================================
# Remoção (admin)
# ============================================================


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_field(
    field_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: CustomFieldService = Depends(get_custom_field_service),
) -> None:
    """Remove um custom field (apenas admin)."""
    service.delete_field(field_id, current)