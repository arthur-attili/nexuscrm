"""
Validador de custom_values contra os custom_fields definidos.

Garante que:
- Campos obrigatórios estão presentes e não vazios.
- Valores respeitam o tipo do campo (text, number, date, etc).
- Valores de select/multiselect estão dentro das opções permitidas.
"""

from datetime import date, datetime
from typing import Any

from fastapi import HTTPException, status

from app.domains.custom_fields.repository import CustomFieldRepository


class CustomFieldValidator:
    """Valida e normaliza `custom_values` para um dado target."""

    def __init__(self, repo: CustomFieldRepository | None = None):
        self.repo = repo or CustomFieldRepository()

    # --------------------------------------------------------
    # API pública
    # --------------------------------------------------------

    def validate(
        self, target: str, custom_values: dict[str, Any] | None
    ) -> dict[str, Any]:
        """
        Valida e normaliza os `custom_values` de um lead/deal.

        - Campos ausentes/vazios são removidos (a menos que sejam obrigatórios).
        - Valores são convertidos para o tipo correto.
        - Campos em `custom_values` que NÃO correspondem a nenhum custom_field
          são preservados (para não perder dados de campos deletados).
        """
        values = dict(custom_values or {})
        fields = self.repo.list(target=target)

        for field in fields:
            name = field["name"]
            field_type = field["type"]
            is_required = field.get("is_required", False)
            options = field.get("options") or []

            raw = values.get(name)

            # Campo ausente ou vazio (string vazia, None)
            if raw is None or (isinstance(raw, str) and raw.strip() == ""):
                if is_required:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"O campo customizado '{name}' é obrigatório.",
                    )
                values.pop(name, None)
                continue

            # Valida por tipo
            try:
                normalized = self._validate_type(
                    name=name,
                    value=raw,
                    field_type=field_type,
                    options=options,
                )
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(e),
                )

            values[name] = normalized

        return values

    # --------------------------------------------------------
    # Validação por tipo
    # --------------------------------------------------------

    def _validate_type(
        self,
        name: str,
        value: Any,
        field_type: str,
        options: list[Any],
    ) -> Any:
        """Valida e normaliza um valor individual. Levanta ValueError."""

        if field_type == "text":
            if not isinstance(value, str):
                raise ValueError(f"O campo '{name}' deve ser um texto.")
            return value.strip()

        if field_type == "url":
            if not isinstance(value, str):
                raise ValueError(f"O campo '{name}' deve ser uma URL.")
            v = value.strip()
            if not (v.startswith("http://") or v.startswith("https://")):
                raise ValueError(
                    f"O campo '{name}' deve ser uma URL válida (http:// ou https://)."
                )
            return v

        if field_type == "number":
            if isinstance(value, bool):
                raise ValueError(f"O campo '{name}' deve ser um número.")
            if isinstance(value, (int, float)):
                return value
            if isinstance(value, str):
                try:
                    if "." in value or "," in value:
                        return float(value.replace(",", "."))
                    return int(value)
                except ValueError:
                    raise ValueError(f"O campo '{name}' deve ser um número.")
            raise ValueError(f"O campo '{name}' deve ser um número.")

        if field_type == "date":
            if isinstance(value, (date, datetime)):
                return value.isoformat()[:10]
            if isinstance(value, str):
                try:
                    datetime.fromisoformat(value.replace("Z", "+00:00"))
                    return value[:10]
                except ValueError:
                    raise ValueError(
                        f"O campo '{name}' deve ser uma data válida (YYYY-MM-DD)."
                    )
            raise ValueError(f"O campo '{name}' deve ser uma data.")

        if field_type == "checkbox":
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                if value.lower() in ("true", "1", "on", "yes"):
                    return True
                if value.lower() in ("false", "0", "off", "no"):
                    return False
            raise ValueError(
                f"O campo '{name}' deve ser booleano (true/false)."
            )

        if field_type == "select":
            allowed = self._extract_option_values(options)
            if value not in allowed:
                raise ValueError(
                    f"O campo '{name}' deve ser uma das opções: "
                    f"{', '.join(map(str, allowed))}."
                )
            return value

        if field_type == "multiselect":
            if not isinstance(value, list):
                raise ValueError(
                    f"O campo '{name}' deve ser uma lista de opções."
                )
            allowed = self._extract_option_values(options)
            invalid = [v for v in value if v not in allowed]
            if invalid:
                raise ValueError(
                    f"O campo '{name}' contém opções inválidas: "
                    f"{', '.join(map(str, invalid))}."
                )
            return value

        # Tipo desconhecido — preserva o valor cru (fallback seguro)
        return value

    def _extract_option_values(self, options: list[Any]) -> list[Any]:
        """
        Normaliza as opções para uma lista de valores permitidos.
        Aceita tanto ["A", "B"] quanto [{"label": "A", "value": "a"}].
        """
        result: list[Any] = []
        for opt in options:
            if isinstance(opt, dict) and "value" in opt:
                result.append(opt["value"])
            else:
                result.append(opt)
        return result