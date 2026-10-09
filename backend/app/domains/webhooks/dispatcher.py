"""
Dispatcher de Webhooks: envia eventos para URLs externas (n8n, Zapier...).

Funcionalidades:
- Assina o payload com HMAC-SHA256 usando o secret de cada webhook.
- Envia POST assíncrono (thread em background) para não bloquear a API.
- Retenta 3 vezes com backoff exponencial (1s, 3s, 9s).
- Registra cada tentativa em `webhook_deliveries` para auditoria.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import threading
from datetime import datetime, timezone
from typing import Any

import httpx

from app.domains.webhooks.repository import WebhookRepository

# Configurações
MAX_ATTEMPTS = 3
TIMEOUT_SECONDS = 10
BACKOFF_SECONDS = [1, 3, 9]  # intervalo entre tentativas
USER_AGENT = "NexusCRM-Webhooks/1.0"


def _sign_payload(secret: str, body: bytes) -> str:
    """Gera assinatura HMAC-SHA256 do payload, formato 'sha256=<hex>'."""
    signature = hmac.new(
        secret.encode("utf-8"), body, hashlib.sha256
    ).hexdigest()
    return f"sha256={signature}"


def _deliver(
    webhook: dict,
    event: str,
    payload: dict[str, Any],
    repo: WebhookRepository,
) -> None:
    """
    Executa a entrega de UM webhook com retry.
    Roda em thread própria.
    """
    body_dict = {
        "event": event,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": payload,
    }
    body_bytes = json.dumps(body_dict, default=str).encode("utf-8")

    signature = _sign_payload(webhook["secret"], body_bytes)

    headers = {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        "X-Nexus-Event": event,
        "X-Nexus-Signature": signature,
        "X-Nexus-Webhook-Id": webhook["id"],
    }

    # Cria o registro de delivery (status: pending)
    try:
        delivery = repo.create_delivery(
            {
                "webhook_id": webhook["id"],
                "event": event,
                "payload": body_dict,
                "attempts": 0,
                "success": False,
            }
        )
        delivery_id = delivery["id"]
    except Exception as e:
        # Se nem o log conseguimos criar, não tem como continuar
        print(f"[webhooks] Erro ao registrar delivery: {e}")
        return

    # Tenta entregar
    last_error: str | None = None
    last_status: int | None = None
    last_body: str | None = None

    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
                response = client.post(
                    webhook["url"], content=body_bytes, headers=headers
                )

            last_status = response.status_code
            last_body = response.text[:1000]  # corta para não estourar o banco

            if 200 <= response.status_code < 300:
                repo.update_delivery(
                    delivery_id,
                    {
                        "response_status": response.status_code,
                        "response_body": last_body,
                        "success": True,
                        "attempts": attempt,
                        "completed_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
                return  # sucesso
            else:
                last_error = f"HTTP {response.status_code}"

        except httpx.TimeoutException:
            last_error = "timeout"
        except httpx.RequestError as e:
            last_error = f"network: {type(e).__name__}"
        except Exception as e:
            last_error = f"unexpected: {type(e).__name__}"

        # Se não foi a última tentativa, espera antes de retentar
        if attempt < MAX_ATTEMPTS:
            import time

            time.sleep(BACKOFF_SECONDS[attempt - 1])

    # Esgotou as tentativas
    repo.update_delivery(
        delivery_id,
        {
            "response_status": last_status,
            "response_body": last_body,
            "success": False,
            "attempts": MAX_ATTEMPTS,
            "error": last_error,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        },
    )


def _worker(owner_id: str, event: str, payload: dict[str, Any]) -> None:
    """
    Thread principal do dispatch: busca webhooks ativos e entrega cada um.
    """
    try:
        repo = WebhookRepository()
        webhooks = repo.list_active_by_owner_and_event(owner_id, event)

        for webhook in webhooks:
            # Cada webhook é entregue numa thread própria para isolar falhas.
            threading.Thread(
                target=_deliver,
                args=(webhook, event, payload, repo),
                daemon=True,
            ).start()
    except Exception as e:
        # Nunca deixa a thread principal quebrar a API
        print(f"[webhooks] Erro no dispatcher de {event}: {e}")


def dispatch_event(
    owner_id: str, event: str, payload: dict[str, Any]
) -> None:
    """
    Dispara um evento para todos os webhooks ativos do usuário.

    Fire-and-forget: retorna imediatamente e processa em background.
    Nunca levanta exceção — erros são logados.
    """
    threading.Thread(
        target=_worker,
        args=(owner_id, event, payload),
        daemon=True,
    ).start()