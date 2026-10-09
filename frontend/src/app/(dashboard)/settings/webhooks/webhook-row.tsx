"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Trash2,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  Pencil,
  Power,
} from "lucide-react";

import {
  deleteWebhookAction,
  rotateSecretAction,
  toggleWebhookAction,
  updateWebhookAction,
  type DeleteWebhookState,
  type RotateSecretState,
  type ToggleWebhookState,
  type UpdateWebhookState,
} from "./actions";
import { WEBHOOK_EVENTS, eventLabel } from "./webhook-events";
import type { Webhook } from "@/lib/api/types";

type Props = {
  webhook: Webhook;
};

export function WebhookRow({ webhook }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(webhook.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  if (editing) {
    return (
      <EditForm webhook={webhook} onCancel={() => setEditing(false)} />
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-md p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-sm font-medium text-white">
              {webhook.name}
            </h3>
            {!webhook.is_active && (
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                inativo
              </span>
            )}
          </div>
          <code className="text-xs text-zinc-500 font-mono break-all">
            {webhook.url}
          </code>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ToggleButton
            webhookId={webhook.id}
            isActive={webhook.is_active}
          />
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Eventos */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {webhook.events.map((evt) => (
          <span
            key={evt}
            className="text-xs px-2 py-0.5 rounded bg-blue-950/40 text-blue-300 border border-blue-900"
          >
            {eventLabel(evt)}
          </span>
        ))}
      </div>

      {/* Secret */}
      <div className="border-t border-zinc-800 pt-3 mt-3">
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">
          Secret (para validar assinatura HMAC)
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-zinc-400 bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded truncate">
            {showSecret ? webhook.secret : "•".repeat(32)}
          </code>
          <button
            onClick={() => setShowSecret(!showSecret)}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title={showSecret ? "Ocultar" : "Mostrar"}
          >
            {showSecret ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={copySecret}
            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            title="Copiar"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <RotateSecretButton webhookId={webhook.id} />
        </div>
      </div>

      {confirmDelete && (
        <DeleteConfirm
          webhookId={webhook.id}
          webhookName={webhook.name}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Toggle ativo/inativo
// ============================================================

function ToggleButton({
  webhookId,
  isActive,
}: {
  webhookId: string;
  isActive: boolean;
}) {
  const action = toggleWebhookAction.bind(null, webhookId, !isActive);
  const [, formAction, isPending] = useActionState<
    ToggleWebhookState,
    FormData
  >(action, {});

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={isPending}
        className={`p-1.5 rounded transition-colors ${
          isActive
            ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
            : "text-zinc-500 hover:text-white hover:bg-zinc-800"
        }`}
        title={isActive ? "Desativar" : "Ativar"}
      >
        <Power className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}

// ============================================================
// Rotacionar secret
// ============================================================

function RotateSecretButton({ webhookId }: { webhookId: string }) {
  const action = rotateSecretAction.bind(null, webhookId);
  const [state, formAction, isPending] = useActionState<
    RotateSecretState,
    FormData
  >(action, {});

  const [confirming, setConfirming] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);

  useEffect(() => {
    if (state.secret) {
      setNewSecret(state.secret);
      setConfirming(false);
    }
  }, [state.secret]);

  if (newSecret) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              Secret rotacionado
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mb-3">
            Atualize o secret no seu endpoint (n8n, etc). O secret antigo
            não funciona mais.
          </p>
          <code className="block text-xs font-mono text-emerald-400 bg-zinc-900 border border-zinc-800 px-3 py-2 rounded break-all">
            {newSecret}
          </code>
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setNewSecret(null)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <form action={formAction}>
        <button
          type="submit"
          disabled={isPending}
          className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-500 disabled:bg-zinc-700 text-white rounded transition-colors"
        >
          {isPending ? "..." : "Confirmar rotação"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="ml-1 px-2 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors"
      title="Rotacionar secret"
    >
      <RefreshCw className="w-3.5 h-3.5" />
    </button>
  );
}

// ============================================================
// Modal de edição
// ============================================================

function EditForm({
  webhook,
  onCancel,
}: {
  webhook: Webhook;
  onCancel: () => void;
}) {
  const action = updateWebhookAction.bind(null, webhook.id);
  const [state, formAction, isPending] = useActionState<
    UpdateWebhookState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <div className="bg-zinc-900/50 border border-blue-900/60 rounded-md p-4">
      <form action={formAction} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            name="name"
            required
            maxLength={120}
            defaultValue={webhook.name}
            placeholder="Nome"
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <input
            type="url"
            name="url"
            required
            defaultValue={webhook.url}
            placeholder="https://..."
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {WEBHOOK_EVENTS.map((evt) => (
            <label
              key={evt.value}
              className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer"
            >
              <input
                type="checkbox"
                name="events"
                value={evt.value}
                defaultChecked={webhook.events.includes(evt.value)}
                className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span>{evt.label}</span>
            </label>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={webhook.is_active}
            className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
          />
          Webhook ativo
        </label>

        {state.error && (
          <div className="bg-red-950/50 border border-red-800 text-red-300 text-xs rounded-md px-3 py-2">
            {state.error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white text-xs font-medium rounded transition-colors"
          >
            {isPending ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// Confirmação de delete
// ============================================================

function DeleteConfirm({
  webhookId,
  webhookName,
  onCancel,
}: {
  webhookId: string;
  webhookName: string;
  onCancel: () => void;
}) {
  const action = deleteWebhookAction.bind(null, webhookId);
  const [state, formAction, isPending] = useActionState<
    DeleteWebhookState,
    FormData
  >(action, {});

  useEffect(() => {
    if (state.success) onCancel();
  }, [state.success, onCancel]);

  return (
    <div className="absolute inset-0 z-10 bg-zinc-950/95 backdrop-blur-sm rounded-md flex items-center justify-center gap-3 px-4">
      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
      <span className="text-sm text-zinc-300">
        Excluir webhook{" "}
        <span className="text-white font-medium">"{webhookName}"</span>?
      </span>
      <form action={formAction} className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-2 py-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-2.5 py-1 text-xs bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 text-white rounded transition-colors"
        >
          {isPending ? "..." : "Excluir"}
        </button>
      </form>
    </div>
  );
}