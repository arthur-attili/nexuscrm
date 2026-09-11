"""
Dependências compartilhadas entre domínios.
"""

from fastapi import Depends
from gotrue.types import User

from app.core.auth import get_current_user
from app.core.database import supabase


class CurrentUser:
    """
    Representa o usuário autenticado, já com o role vindo do banco (profiles).
    Não é o usuário do Supabase Auth — é o usuário do CRM.
    """

    def __init__(self, id: str, role: str, name: str):
        self.id = id
        self.role = role
        self.name = name

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_manager(self) -> bool:
        return self.role == "gerente"

    @property
    def can_see_all_leads(self) -> bool:
        """Admin e gerente veem todos os leads. Vendedor vê só os seus."""
        return self.role in ("admin", "gerente")


async def get_current_user_with_role(
    user: User = Depends(get_current_user),
) -> CurrentUser:
    """
    Busca o perfil do usuário autenticado e devolve um CurrentUser com role.
    Usado em domínios que precisam de controle de acesso.
    """
    user_id = str(user.id)
    response = (
        supabase.table("profiles")
        .select("id, role, name")
        .eq("id", user_id)
        .execute()
    )

    if not response.data:
        # Usuário autenticado no Auth mas sem perfil no banco.
        # Tratamos como vendedor (menor privilégio), evitando vazar dados.
        return CurrentUser(id=user_id, role="vendedor", name="")

    profile = response.data[0]
    return CurrentUser(
        id=profile["id"],
        role=profile["role"],
        name=profile["name"],
    )