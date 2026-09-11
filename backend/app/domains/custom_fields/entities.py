"""
Modelos do domínio de Campos Customizáveis (Custom Fields).
"""

from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

# Tipos suportados para um campo customizável.
CustomFieldType = Literal[
    "text",
    "number",
    "date",
    "select",
    "multiselect",
    "checkbox",
    "url",
]

# Alvo: o campo se aplica a leads ou a deals.
CustomFieldTarget = Literal["lead", "deal"]

# Tipos que exigem uma lista de opções.
_TYPES_WITH_OPTIONS = {"select", "multiselect"}


class CustomFieldBase(BaseModel):
    """Campos base de um custom field."""
    name: str = Field(..., min_length=1, max_length=80)
    type: CustomFieldType
    target: CustomFieldTarget
    options: Optional[list[Any]] = None
    is_required: bool = False
    is_unique: bool = False

    @model_validator(mode="after")
    def validate_options(self) -> "CustomFieldBase":
        """
        Garante coerência entre 'type' e 'options':
        - select/multiselect: options é OBRIGATÓRIO e não pode ser vazio.
        - outros tipos: options NÃO é permitido.
        """
        if self.type in _TYPES_WITH_OPTIONS:
            if not self.options:
                raise ValueError(
                    f"'options' é obrigatório e não pode ser vazio para o tipo '{self.type}'."
                )
        else:
            if self.options:
                raise ValueError(
                    f"'options' não é permitido para o tipo '{self.type}'."
                )
        return self


class CustomFieldCreate(CustomFieldBase):
    """Payload para criar um custom field."""
    pass


class CustomFieldUpdate(BaseModel):
    """
    Payload para atualizar um custom field (parcial).

    Nota: 'type' e 'target' NÃO podem ser alterados após a criação.
    Mudar o tipo de um campo com dados já salvos em 'custom_values' seria
    catastrófico (dados corrompidos). Se o cliente quiser mudar, deve
    criar um novo campo e migrar os dados manualmente.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=80)
    options: Optional[list[Any]] = None
    is_required: Optional[bool] = None
    is_unique: Optional[bool] = None


class CustomField(CustomFieldBase):
    """Custom field completo, como retornado pela API."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None