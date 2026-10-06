import { apiFetch } from "./client";
import type { ApiKey, ApiKeyCreated } from "./types";

export async function listApiKeys(): Promise<ApiKey[]> {
  return apiFetch<ApiKey[]>("/api-keys");
}

export type CreateApiKeyInput = {
  name: string;
};

export async function createApiKey(
  data: CreateApiKeyInput,
): Promise<ApiKeyCreated> {
  return apiFetch<ApiKeyCreated>("/api-keys", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteApiKey(id: string): Promise<void> {
  return apiFetch<void>(`/api-keys/${id}`, { method: "DELETE" });
}