"""
Router HTTP do domínio de Deals.
"""

from fastapi import APIRouter, Depends, Query, status

from app.domains.deals.entities import (
    Deal,
    DealCreate,
    DealList,
    DealUpdate,
)
from app.domains.deals.service import DealService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/deals",
    tags=["Deals"],
)


def get_deal_service() -> DealService:
    """Injeção de dependência do service."""
    return DealService()


# ============================================================
# Listagem
# ============================================================


@router.get("", response_model=DealList)
def list_deals(
    lead_id: str | None = Query(None, description="Filtrar por lead"),
    pipeline_id: str | None = Query(None, description="Filtrar por pipeline"),
    stage_id: str | None = Query(None, description="Filtrar por stage"),
    status_filter: str | None = Query(
        None, alias="status", description="Filtrar por status: open/won/lost"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current: CurrentUser = Depends(get_current_user_with_role),
    service: DealService = Depends(get_deal_service),
) -> DealList:
    """Lista deals com filtros e paginação."""
    return service.list_deals(
        current=current,
        lead_id=lead_id,
        pipeline_id=pipeline_id,
        stage_id=stage_id,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )


# ============================================================
# Criação
# ============================================================


@router.post("", response_model=Deal, status_code=status.HTTP_201_CREATED)
def create_deal(
    payload: DealCreate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: DealService = Depends(get_deal_service),
) -> Deal:
    """Cria um novo deal (marca o lead como converted)."""
    return service.create_deal(payload, current)


# ============================================================
# Busca individual
# ============================================================


@router.get("/{deal_id}", response_model=Deal)
def get_deal(
    deal_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: DealService = Depends(get_deal_service),
) -> Deal:
    """Retorna um deal específico."""
    return service.get_deal(deal_id, current)


# ============================================================
# Atualização
# ============================================================


@router.patch("/{deal_id}", response_model=Deal)
def update_deal(
    deal_id: str,
    payload: DealUpdate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: DealService = Depends(get_deal_service),
) -> Deal:
    """Atualiza um deal existente."""
    return service.update_deal(deal_id, payload, current)


# ============================================================
# Remoção
# ============================================================


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: DealService = Depends(get_deal_service),
) -> None:
    """Remove um deal."""
    service.delete_deal(deal_id, current)