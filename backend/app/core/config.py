"""
Configurações centrais da aplicação.
Carrega variáveis de ambiente a partir do arquivo .env (na raiz de backend/).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configurações da aplicação carregadas de variáveis de ambiente.
    """

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
    DEBUG: bool = True


# Instância única (singleton) de configurações
settings = Settings()