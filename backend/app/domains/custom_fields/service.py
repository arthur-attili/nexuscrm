"""
Serviço de Custom Fields: regras de negócio.

Regras de acesso:
- Listar/ver: qualquer usuário autenticado.
- Criar/atualizar/deletar: apenas ADMIN.

Regras de negócio:
- Não podem existir dois campos com o mesmo 'name' no mesmo 'target'.
- 'type' e 'target' são imutáveis após a criação.
"""

from fastapi import HTTPException, status

from app.domains.custom_fields.entities import (
    CustomField,
    CustomFieldCreate,
    CustomFieldUpdate,
)
from app.domains.custom_fields.repository import CustomFieldRepository
from app.shared.dependencies import CurrentUser


class CustomFieldService:
    """Regras de negócio para custom fields."""

    def __init__(self, repo: CustomFieldRepository | None = None):
        self.repo = repo or CustomFieldRepository()

    # --------------------------------------------------------
    # Helpers
    # --------------------------------------------------------

    def _ensure_admin(self, current: CurrentUser) -> None:
        """Apenas admin pode criar/editar/deletar custom fields."""
        if not current.is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Apenas administradores podem gerenciar campos customizáveis.",
            )

    def _ensure_name_is_unique(
        self, name: str, target: str, ignore_id: str | None = None
    ) -> None:
        """
        Garante que não exista outro custom field com o mesmo nome no mesmo target.

        'ignore_id' é usado no update, para não bloquear quando o nome
        não foi alterado (o campo atual não colide com ele mesmo).
        """
        existing = self.repo.get_by_name_and_target(name, target)
        if existing and existing["id"] != ignore_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe um campo '{name}' para {target}.",
            )

    # --------------------------------------------------------
    # Listagem e busca
    # --------------------------------------------------------

    def list_fields(
        self, current: CurrentUser, target: str | None = None
    ) -> list[CustomField]:
        """Lista custom fields, com filtro opcional por target."""
        data = self.repo.list(target=target)
        return [CustomField(**f) for f in data]

    def get_field(self, field_id: str, current: CurrentUser) -> CustomField:
        """Busca um custom field por ID."""
        data = self.repo.get_by_id(field_id)
        if not data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campo customizável não encontrado.",
            )
        return CustomField(**data)

    # --------------------------------------------------------
    # Criação
    # --------------------------------------------------------

    def create_field(
        self, payload: CustomFieldCreate, current: CurrentUser
    ) -> CustomField:
        """Cria um novo custom field."""
        self._ensure_admin(current)
        self._ensure_name_is_unique(payload.name, payload.target)

        data = payload.model_dump()
        data["created_by"] = current.id

        created = self.repo.create(data)
        return CustomField(**created)

    # --------------------------------------------------------
    # Atualização
    # --------------------------------------------------------

    def update_field(
        self,
        field_id: str,
        payload: CustomFieldUpdate,
        current: CurrentUser,
    ) -> CustomField:
        """Atualiza um custom field existente."""
        self._ensure_admin(current)

        existing = self.get_field(field_id, current)
        data = payload.model_dump(exclude_unset=True, exclude_none=True)

        # Se o nome foi alterado, checar duplicidade.
        if "name" in data and data["name"] != existing.name:
            self._ensure_name_is_unique(
                data["name"], existing.target, ignore_id=field_id
            )

        if not data:
            # Nada para atualizar — retorna o atual.
            return existing

        updated = self.repo.update(field_id, data)
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campo customizável não encontrado.",
            )
        return CustomField(**updated)

    # --------------------------------------------------------
    # Remoção
    # --------------------------------------------------------

    def delete_field(self, field_id: str, current: CurrentUser) -> None:
        """
        Remove um custom field.

        ⚠️ Nota: os 'custom_values' já salvos em leads/deals que referenciam
        este campo NÃO são apagados automaticamente (são JSONB livres).
        Limpar esses valores órfãos é responsabilidade do cliente ou de
        uma feature futura de "cleanup de campos".
        """
        self._ensure_admin(current)
        self.get_field(field_id, current)  # valida existência

        deleted = self.repo.delete(field_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Campo customizável não encontrado.",
            )