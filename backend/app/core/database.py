"""
Clientes Supabase centralizados (singletons).

Dois clientes isolados:
- `supabase`: para operações de banco (service_role, RLS ignorado).
- `auth_supabase`: apenas para validação de tokens (evita que
  `get_user` sobrescreva a sessão do cliente principal).
"""

from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Cliente principal (service_role) — usado para operações de banco."""
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY,
    )


@lru_cache(maxsize=1)
def get_auth_client() -> Client:
    """Cliente dedicado à validação de tokens (isolado do principal)."""
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_KEY,
    )


# Instâncias prontas para importação
supabase: Client = get_supabase_client()
auth_supabase: Client = get_auth_client()


def check_health() -> tuple[bool, str | None]:
    """
    Verifica se a conexão com o Supabase está funcionando.

    Retorna (is_healthy, error_message).
    Faz uma query leve (SELECT count em profiles) para não pesar.
    """
    try:
        response = (
            supabase.table("profiles").select("id", count="exact").limit(1).execute()
        )
        # Se não levantou exceção, está tudo certo
        _ = response.count
        return True, None
    except Exception as e:
        return False, str(e)