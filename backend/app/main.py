"""
Entry point da aplicação FastAPI do NexusCRM.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.domains.activities.router import router as activities_router
from app.domains.api_keys.router import router as api_keys_router
from app.domains.custom_fields.router import router as custom_fields_router
from app.domains.dashboard.router import router as dashboard_router
from app.domains.deals.router import router as deals_router
from app.domains.leads.router import router as leads_router
from app.domains.notes.router import router as notes_router
from app.domains.pipelines.router import router as pipelines_router
from app.domains.profiles.router import router as profiles_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    description="API do NexusCRM - CRM customizável com automações.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.get("/health", tags=["Health"])
def health_check():
    """Endpoint público para verificar se a API está no ar."""
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }