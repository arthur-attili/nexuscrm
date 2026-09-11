"""
Router HTTP do domínio de Leads.
"""

from fastapi import APIRouter, Depends, Query, status

from app.domains.leads.entities import (
    Lead,
    LeadCreate,
    LeadList,
    LeadUpdate,
)
from app.domains.leads.service import LeadService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/leads",
    tags=["Leads"],
)


def get_lead_service() -> LeadService:
    """Injeção de dependência do service."""
    return LeadService()


# ============================================================
# Listagem (com filtros e paginação)
# ============================================================


@router.get("", response_model=LeadList)
def list_leads(
    pipeline_id: str | None = Query(None, description="Filtrar por pipeline"),
    stage_id: str | None = Query(None, description="Filtrar por stage"),
    status_filter: str | None = Query(
        None, alias="status", description="Filtrar por status (ex: 'new', 'qualified')"
    ),
    search: str | None = Query(None, description="Busca por nome (case-insensitive)"),
    page: int = Query(1, ge=1, description="Página (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Itens por página (1-100)"),
    current: CurrentUser = Depends(get_current_user_with_role),
    service: LeadService = Depends(get_lead_service),
) -> LeadList:
    """
    Lista leads com filtros e paginação.

    Vendedores veem apenas os seus. Gerentes e admins veem todos.
    """
    return service.list_leads(
        current=current,
        pipeline_id=pipeline_id,
        stage_id=stage_id,
        status_filter=status_filter,
        search=search,
        page=page,
        page_size=page_size,
    )


# ============================================================
# Criação
# ============================================================


@router.post("", response_model=Lead, status_code=status.HTTP_201_CREATED)
def create_lead(
    payload: LeadCreate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: LeadService = Depends(get_lead_service),
) -> Lead:
    """Cria um novo lead (owner_id = usuário logado)."""
    return service.create_lead(payload, current)


# ============================================================
# Busca individual
# ============================================================


@router.get("/{lead_id}", response_model=Lead)
def get_lead(
    lead_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: LeadService = Depends(get_lead_service),
) -> Lead:
    """Retorna um lead específico."""
    return service.get_lead(lead_id, current)


# ============================================================
# Atualização
# ============================================================


@router.patch("/{lead_id}", response_model=Lead)
def update_lead(
    lead_id: str,
    payload: LeadUpdate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: LeadService = Depends(get_lead_service),
) -> Lead:
    """Atualiza um lead existente."""
    return service.update_lead(lead_id, payload, current)


# ============================================================
# Remoção
# ============================================================


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(
    lead_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: LeadService = Depends(get_lead_service),
) -> None:
    """Remove um lead."""
    service.delete_lead(lead_id, current)