"""
Router HTTP do domínio de Perfis.
"""

from fastapi import APIRouter, Depends
from gotrue.types import User

from app.core.auth import get_current_user
from app.domains.profiles.entities import Profile, ProfileUpdate
from app.domains.profiles.service import ProfileService

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def get_profile_service() -> ProfileService:
    """Injeção de dependência do service (facilita testes com mocks)."""
    return ProfileService()


@router.get("/me", response_model=Profile)
def get_my_profile(
    user: User = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> Profile:
    """Retorna o perfil do usuário autenticado."""
    return service.get_profile(str(user.id))


@router.patch("/me", response_model=Profile)
def update_my_profile(
    payload: ProfileUpdate,
    user: User = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> Profile:
    """Atualiza o perfil do usuário autenticado."""
    return service.update_profile(str(user.id), payload)