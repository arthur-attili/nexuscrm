import { apiFetch } from "./client";
import type {
  Webhook,
  WebhookDelivery,
  WebhookEvent,
} from "./types";

export async function listWebhooks(): Promise<Webhook[]> {
  return apiFetch<Webhook[]>("/webhooks");
}

export type CreateWebhookInput = {
  name: string;
  url: string;
  events: WebhookEvent[];
  is_active?: boolean;
};

export async function createWebhook(
  data: CreateWebhookInput,
): Promise<Webhook> {
  return apiFetch<Webhook>("/webhooks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateWebhookInput = {
  name?: string;
  url?: string;
  events?: WebhookEvent[];
  is_active?: boolean;
};

export async function updateWebhook(
  id: string,
  data: UpdateWebhookInput,
): Promise<Webhook> {
  return apiFetch<Webhook>(`/webhooks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteWebhook(id: string): Promise<void> {
  return apiFetch<void>(`/webhooks/${id}`, { method: "DELETE" });
}

export async function rotateWebhookSecret(id: string): Promise<Webhook> {
  return apiFetch<Webhook>(`/webhooks/${id}/rotate-secret`, {
    method: "POST",
  });
}

export async function listWebhookDeliveries(
  id: string,
  limit = 20,
): Promise<WebhookDelivery[]> {
  return apiFetch<WebhookDelivery[]>(
    `/webhooks/${id}/deliveries?limit=${limit}`,
  );
}