"""
Configuração de logging da aplicação.

Formato:
    2026-10-09 14:32:11 | INFO     | app.domains.leads.service | Criando lead

Em produção, defina LOG_LEVEL=INFO ou WARNING.
Em desenvolvimento, LOG_LEVEL=DEBUG mostra mais detalhes.
"""

import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """
    Configura o logger raiz da aplicação.

    - Envia logs para stdout (Railway/Render capturam automaticamente).
    - Formata com timestamp, nível, módulo e mensagem.
    - Ajusta o nível conforme LOG_LEVEL do .env.
    """
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Formato único e legível
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Handler para stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Logger raiz
    root = logging.getLogger()
    root.handlers.clear()  # evita duplicação em reloads do uvicorn
    root.addHandler(handler)
    root.setLevel(level)

    # Silencia loggers barulhentos de libs externas
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Atalho para obter um logger já configurado."""
    return logging.getLogger(name)