"use server";

import { revalidatePath } from "next/cache";

import {
  createApiKey,
  deleteApiKey,
} from "@/lib/api/api-keys";
import { ApiError } from "@/lib/api/client";
import type { ApiKeyCreated } from "@/lib/api/types";

export type CreateApiKeyState = {
  error?: string;
  created?: ApiKeyCreated;
};

export async function createApiKeyAction(
  _prevState: CreateApiKeyState,
  formData: FormData,
): Promise<CreateApiKeyState> {
  const name = (formData.get("name") as string)?.trim();

  if (!name) return { error: "Informe um nome para identificar a chave." };
  if (name.length > 80) {
    return { error: "O nome deve ter no máximo 80 caracteres." };
  }

  try {
    const created = await createApiKey({ name });
    revalidatePath("/settings/api-keys");
    return { created };
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao criar API key. Tente novamente." };
  }
}

export type DeleteApiKeyState = { error?: string } | null;

export async function deleteApiKeyAction(
  keyId: string,
  _prevState: DeleteApiKeyState,
  _formData: FormData,
): Promise<DeleteApiKeyState> {
  try {
    await deleteApiKey(keyId);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao revogar API key. Tente novamente." };
  }

  revalidatePath("/settings/api-keys");
  return null;
}