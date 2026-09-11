"""
Serviço de Perfis: regras de negócio.
"""

from fastapi import HTTPException, status

from app.domains.profiles.entities import Profile, ProfileUpdate
from app.domains.profiles.repository import ProfileRepository


class ProfileService:
    """Regras de negócio para perfis."""

    def __init__(self, repository: ProfileRepository | None = None):
        self.repository = repository or ProfileRepository()

    def get_profile(self, user_id: str) -> Profile:
        """Retorna o perfil do usuário ou levanta 404."""
        data = self.repository.get_by_id(user_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil não encontrado.",
            )
        return Profile(**data)

    def update_profile(self, user_id: str, payload: ProfileUpdate) -> Profile:
        """Atualiza o perfil do usuário."""
        data = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not data:
            # Nada a atualizar — retorna o perfil atual.
            return self.get_profile(user_id)

        updated = self.repository.update(user_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Perfil não encontrado.",
            )
        return Profile(**updated)