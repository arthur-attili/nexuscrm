"""
Handlers globais de exceção do FastAPI.

Garante que:
- Erros não tratados retornem 500 com mensagem amigável (nunca o stacktrace).
- Erros do Supabase/PostgREST não vazem detalhes internos.
- Tudo seja registrado em log para debug posterior.
"""

import logging

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError as PostgrestAPIError

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI) -> None:
    """Registra os handlers na aplicação."""

    # --- Erros de validação do Pydantic ---
    @app.exception_handler(RequestValidationError)
    async def validation_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        """
        Retorna 422 com o formato padrão do FastAPI.
        Loga o erro para debug (útil em produção quando o cliente envia payload errado).
        """
        logger.warning(
            "Erro de validação em %s %s: %s",
            request.method,
            request.url.path,
            exc.errors(),
        )
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": exc.errors()},
        )

    # --- Erros do PostgREST (Supabase) ---
    @app.exception_handler(PostgrestAPIError)
    async def postgrest_handler(
        request: Request, exc: PostgrestAPIError
    ) -> JSONResponse:
        """
        Converte erros do Supabase em resposta amigável,
        sem vazar detalhes internos do banco.
        """
        logger.error(
            "Erro do Supabase em %s %s: %s",
            request.method,
            request.url.path,
            str(exc),
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "detail": "Serviço temporariamente indisponível. "
                "Tente novamente em alguns instantes."
            },
        )

    # --- Erros não tratados (última linha de defesa) ---
    @app.exception_handler(Exception)
    async def unhandled_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        """
        Nunca deixa o stacktrace vazar para o cliente.
        Loga o erro completo no servidor.
        """
        logger.exception(
            "Erro não tratado em %s %s",
            request.method,
            request.url.path,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Erro interno do servidor. "
                "A equipe foi notificada."
            },
        )