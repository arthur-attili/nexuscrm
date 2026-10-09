"""
Entry point da aplicação FastAPI do NexusCRM.
"""

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import check_health
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.core.rate_limit import RateLimitMiddleware
from app.domains.activities.router import router as activities_router
from app.domains.api_keys.router import router as api_keys_router
from app.domains.custom_fields.router import router as custom_fields_router
from app.domains.dashboard.router import router as dashboard_router
from app.domains.deals.router import router as deals_router
from app.domains.leads.router import router as leads_router
from app.domains.notes.router import router as notes_router
from app.domains.pipelines.router import router as pipelines_router
from app.domains.profiles.router import router as profiles_router
from app.domains.webhooks.router import router as webhooks_router

# Configura logging ANTES de tudo
setup_logging()

# Em produção, esconde o /docs e /redoc por segurança
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    description="API do NexusCRM - CRM customizável com automações.",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
    openapi_url=None if settings.is_production else "/openapi.json",
)

# --- Rate limiting (antes do CORS para valer para tudo) ---
app.add_middleware(
    RateLimitMiddleware,
    max_requests=200,      # 200 req/min por IP em produção
    window_seconds=60,
    exclude_paths=["/health", "/docs", "/openapi.json", "/redoc"],
)

# --- CORS dinâmico (via env var CORS_ORIGINS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Exception handlers ---
register_exception_handlers(app)

# --- Routers ---
app.include_router(profiles_router)
app.include_router(pipelines_router)
app.include_router(leads_router)
app.include_router(custom_fields_router)
app.include_router(deals_router)
app.include_router(dashboard_router)
app.include_router(api_keys_router)
app.include_router(notes_router)
app.include_router(activities_router)
app.include_router(webhooks_router)


@app.get("/health", tags=["Health"])
def health_check() -> JSONResponse:
    """Endpoint de health check (sempre público, sem rate limit)."""
    is_healthy, error = check_health()

    if not is_healthy:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "app": settings.APP_NAME,
                "version": settings.APP_VERSION,
                "error": error,
            },
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "ok",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        },
    )