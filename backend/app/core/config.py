"""
Configurações centrais da aplicação.
Carrega variáveis de ambiente a partir do arquivo .env (na raiz de backend/).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações da aplicação carregadas de variáveis de ambiente."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Supabase ---
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str

    # --- Aplicação ---
    APP_NAME: str = "NexusCRM"
    APP_VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"  # "development" | "production"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # --- CORS ---
    # Lista separada por vírgula. Aceita wildcards simples.
    # Ex (dev):  "http://localhost:3000"
    # Ex (prod): "https://nexuscrm.vercel.app,https://app.nexuscrm.com"
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        """Converte CORS_ORIGINS em lista."""
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"


# Instância única (singleton)
settings = Settings()