"""
Rate limiting em memória por IP.

Funciona bem para deploys de instância única (Railway, Render free).
Se um dia escalarmos para múltiplas instâncias, trocar por Redis
(com `slowapi` + `limits[redis]` ou similar).
"""

from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock
from typing import Callable

from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware de rate limiting por IP usando sliding window.

    Configuração:
    - `max_requests`: número máximo de requests por janela
    - `window_seconds`: tamanho da janela em segundos
    - `exclude_paths`: lista de paths que não são limitados
    """

    def __init__(
        self,
        app,
        max_requests: int = 100,
        window_seconds: int = 60,
        exclude_paths: list[str] | None = None,
    ):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.exclude_paths = exclude_paths or []
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _client_ip(self, request: Request) -> str:
        """
        Extrai o IP do cliente, respeitando `X-Forwarded-For` (proxies,
        Railway, Render, Cloudflare).
        """
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _is_excluded(self, path: str) -> bool:
        """Verifica se o path está na lista de exclusão."""
        return any(path.startswith(ex) for ex in self.exclude_paths)

    async def dispatch(
        self, request: Request, call_next: Callable
    ):
        # Não limita paths excluídos
        if self._is_excluded(request.url.path):
            return await call_next(request)

        ip = self._client_ip(request)
        now = time.time()
        cutoff = now - self.window_seconds

        with self._lock:
            # Descarta hits antigos
            hits = [t for t in self._hits[ip] if t > cutoff]
            hits.append(now)
            self._hits[ip] = hits

            if len(hits) > self.max_requests:
                retry_after = int(hits[0] + self.window_seconds - now) + 1
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={
                        "detail": "Muitas requisições. Aguarde alguns segundos."
                    },
                    headers={"Retry-After": str(retry_after)},
                )

        return await call_next(request)