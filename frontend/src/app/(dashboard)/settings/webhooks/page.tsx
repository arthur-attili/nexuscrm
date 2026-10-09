import { Webhook as WebhookIcon } from "lucide-react";

import { listWebhooks } from "@/lib/api/webhooks";
import { getMyProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { NewWebhookModal } from "./new-webhook-modal";
import { WebhookRow } from "./webhook-row";
import type { Webhook } from "@/lib/api/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WebhooksPage() {
  // Só admin
  let profile;
  try {
    profile = await getMyProfile();
  } catch {
    notFound();
  }
  if (profile.role !== "admin") notFound();

  let webhooks: Webhook[] = [];
  let error: string | null = null;

  try {
    webhooks = await listWebhooks();
  } catch (err) {
    if (err instanceof ApiError) {
      error = err.detail;
    } else {
      error = "Erro ao carregar webhooks.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Webhooks</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Envie eventos do CRM em tempo real para n8n, Zapier ou qualquer
            endpoint HTTP.
          </p>
        </div>
        <NewWebhookModal />
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!error && webhooks.length === 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
          <WebhookIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Nenhum webhook configurado.</p>
          <p className="text-zinc-500 text-sm mt-1">
            Clique em "Novo Webhook" para conectar uma automação.
          </p>
        </div>
      )}

      {!error && webhooks.length > 0 && (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <WebhookRow key={wh.id} webhook={wh} />
          ))}
        </div>
      )}

      {/* Como usar */}
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-5">
        <h3 className="text-sm font-medium text-white mb-2">
          Como usar
        </h3>
        <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside">
          <li>
            No <strong>n8n</strong>, crie um workflow com o nó{" "}
            <strong>Webhook</strong> (método POST) e copie a URL gerada.
          </li>
          <li>Cole essa URL acima ao criar um webhook.</li>
          <li>
            Selecione os eventos que devem disparar o webhook.
          </li>
          <li>
            Valide cada requisição com o header{" "}
            <code className="text-white bg-zinc-800 px-1 rounded">
              X-Nexus-Signature
            </code>{" "}
            (HMAC-SHA256 do body usando o secret).
          </li>
        </ol>
      </div>
    </div>
  );
}