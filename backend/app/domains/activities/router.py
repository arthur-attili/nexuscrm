"""
Router HTTP do domínio de Atividades.
"""

from fastapi import APIRouter, Depends, Query, status

from app.domains.activities.entities import (
    Activity,
    ActivityCreate,
    ActivityUpdate,
)
from app.domains.activities.service import ActivityService
from app.shared.dependencies import CurrentUser, get_current_user_with_role

router = APIRouter(
    prefix="/activities",
    tags=["Activities"],
)


def get_activity_service() -> ActivityService:
    return ActivityService()


@router.get("", response_model=list[Activity])
def list_activities(
    record_type: str = Query(..., description="'lead' ou 'deal'"),
    record_id: str = Query(..., description="ID do lead ou deal"),
    current: CurrentUser = Depends(get_current_user_with_role),
    service: ActivityService = Depends(get_activity_service),
) -> list[Activity]:
    """Lista atividades de um lead ou deal."""
    return service.list_activities(record_type, record_id, current)


@router.post(
    "", response_model=Activity, status_code=status.HTTP_201_CREATED
)
def create_activity(
    payload: ActivityCreate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: ActivityService = Depends(get_activity_service),
) -> Activity:
    """Cria uma nova atividade."""
    return service.create_activity(payload, current)


@router.patch("/{activity_id}", response_model=Activity)
def update_activity(
    activity_id: str,
    payload: ActivityUpdate,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: ActivityService = Depends(get_activity_service),
) -> Activity:
    """Atualiza uma atividade existente."""
    return service.update_activity(activity_id, payload, current)


@router.delete("/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(
    activity_id: str,
    current: CurrentUser = Depends(get_current_user_with_role),
    service: ActivityService = Depends(get_activity_service),
) -> None:
    """Remove uma atividade."""
    service.delete_activity(activity_id, current)