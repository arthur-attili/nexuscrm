"use server";

import { revalidatePath } from "next/cache";

import {
  createWebhook,
  deleteWebhook,
  rotateWebhookSecret,
  updateWebhook,
} from "@/lib/api/webhooks";
import { ApiError } from "@/lib/api/client";
import type { Webhook, WebhookEvent } from "@/lib/api/types";

// ============================================================
// Criar
// ============================================================

export type CreateWebhookState = {
  error?: string;
  success?: boolean;
};

export async function createWebhookAction(
  _prevState: CreateWebhookState,
  formData: FormData,
): Promise<CreateWebhookState> {
  const name = (formData.get("name") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  const events = formData.getAll("events") as WebhookEvent[];

  if (!name) return { error: "Informe um nome para o webhook." };
  if (!url) return { error: "Informe uma URL." };
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return { error: "A URL deve começar com http:// ou https://" };
  }
  if (events.length === 0) {
    return { error: "Selecione pelo menos um evento." };
  }

  try {
    await createWebhook({ name, url, events });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao criar webhook. Tente novamente." };
  }

  revalidatePath("/settings/webhooks");
  return { success: true };
}

// ============================================================
// Atualizar
// ============================================================

export type UpdateWebhookState = {
  error?: string;
  success?: boolean;
};

export async function updateWebhookAction(
  webhookId: string,
  _prevState: UpdateWebhookState,
  formData: FormData,
): Promise<UpdateWebhookState> {
  const name = (formData.get("name") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  const events = formData.getAll("events") as WebhookEvent[];
  const isActive = formData.get("is_active") === "on";

  if (!name) return { error: "Informe um nome." };
  if (!url) return { error: "Informe uma URL." };
  if (events.length === 0) return { error: "Selecione pelo menos um evento." };

  try {
    await updateWebhook(webhookId, {
      name,
      url,
      events,
      is_active: isActive,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao atualizar webhook." };
  }

  revalidatePath("/settings/webhooks");
  return { success: true };
}

// ============================================================
// Toggle ativo/inativo (usado na listagem)
// ============================================================

export type ToggleWebhookState = {
  error?: string;
  success?: boolean;
};

export async function toggleWebhookAction(
  webhookId: string,
  nextActive: boolean,
  _prevState: ToggleWebhookState,
  _formData: FormData,
): Promise<ToggleWebhookState> {
  try {
    await updateWebhook(webhookId, { is_active: nextActive });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao alterar status do webhook." };
  }

  revalidatePath("/settings/webhooks");
  return { success: true };
}

// ============================================================
// Rotacionar secret
// ============================================================

export type RotateSecretState = {
  error?: string;
  secret?: string;
};

export async function rotateSecretAction(
  webhookId: string,
  _prevState: RotateSecretState,
  _formData: FormData,
): Promise<RotateSecretState> {
  try {
    const updated = await rotateWebhookSecret(webhookId);
    revalidatePath("/settings/webhooks");
    return { secret: updated.secret };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao rotacionar secret." };
  }
}

// ============================================================
// Deletar
// ============================================================

export type DeleteWebhookState = {
  error?: string;
  success?: boolean;
};

export async function deleteWebhookAction(
  webhookId: string,
  _prevState: DeleteWebhookState,
  _formData: FormData,
): Promise<DeleteWebhookState> {
  try {
    await deleteWebhook(webhookId);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao excluir webhook." };
  }

  revalidatePath("/settings/webhooks");
  return { success: true };
}