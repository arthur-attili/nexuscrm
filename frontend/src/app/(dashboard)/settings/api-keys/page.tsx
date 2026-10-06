import { Key, Clock } from "lucide-react";

import { listApiKeys } from "@/lib/api/api-keys";
import { ApiError } from "@/lib/api/client";
import { NewKeyModal } from "./new-key-modal";
import { DeleteKeyButton } from "./delete-key-button";
import type { ApiKey } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function ApiKeysPage() {
  let keys: ApiKey[] = [];
  let error: string | null = null;

  try {
    keys = await listApiKeys();
  } catch (err) {
    if (err instanceof ApiError) {
      error = err.detail;
    } else {
      error = "Erro ao carregar API keys.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">API Keys</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Chaves para integrar sistemas externos (n8n, Zapier, sites...)
          </p>
        </div>
        <NewKeyModal />
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!error && keys.length === 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
          <Key className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Nenhuma API key criada ainda.</p>
          <p className="text-zinc-500 text-sm mt-1">
            Clique em "Nova API Key" para gerar uma chave.
          </p>
        </div>
      )}

      {!error && keys.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg divide-y divide-zinc-900">
          {keys.map((key) => (
            <KeyRow key={key.id} apiKey={key} />
          ))}
        </div>
      )}

      <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-5">
        <h3 className="text-sm font-medium text-white mb-2">
          Como usar a API Key
        </h3>
        <p className="text-xs text-zinc-400 mb-3">
          Envie a chave no header <code className="text-white bg-zinc-800 px-1 rounded">Authorization</code> de qualquer requisição:
        </p>
        <code className="block text-xs text-emerald-400 bg-zinc-950 px-3 py-2 rounded border border-zinc-800">
          Authorization: Bearer nxk_xxxxxxxxxxxxxxxxxxxx
        </code>
        <p className="text-xs text-zinc-500 mt-3">
          Funciona com todos os endpoints da API (leads, deals, pipelines,
          custom fields, dashboard...).
        </p>
      </div>
    </div>
  );
}

function KeyRow({ apiKey }: { apiKey: ApiKey }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-medium text-white">
            {apiKey.name}
          </span>
          {!apiKey.is_active && (
            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              inativa
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
          <code className="font-mono text-zinc-400">
            {apiKey.prefix}…
          </code>
          {apiKey.last_used_at ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Último uso:{" "}
              {new Date(apiKey.last_used_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            <span className="text-zinc-600">Nunca usada</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <DeleteKeyButton keyId={apiKey.id} keyName={apiKey.name} />
      </div>
    </div>
  );
}