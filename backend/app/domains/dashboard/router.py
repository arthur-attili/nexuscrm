"""
Router HTTP do domínio de Dashboard.
"""

from fastapi import APIRouter, Depends

from app.domains.dashboard.entities import DashboardMetrics
from app.domains.dashboard.service import DashboardService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


def get_dashboard_service() -> DashboardService:
    return DashboardService()


@router.get("/metrics", response_model=DashboardMetrics)
def get_metrics(
    current: CurrentUser = Depends(get_current_user_with_role),
    service: DashboardService = Depends(get_dashboard_service),
) -> DashboardMetrics:
    """
    Retorna todas as métricas do dashboard.

    Vendedores veem apenas os próprios dados. Gerentes e admins veem tudo.
    """
    return service.get_metrics(current)