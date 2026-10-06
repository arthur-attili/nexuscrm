"use server";

import { revalidatePath } from "next/cache";

import {
  createCustomField,
  deleteCustomField,
  updateCustomField,
} from "@/lib/api/custom-fields";
import { ApiError } from "@/lib/api/client";
import type {
  CustomFieldTarget,
  CustomFieldType,
} from "@/lib/api/types";


const TYPES_WITH_OPTIONS: CustomFieldType[] = ["select", "multiselect"];

export type CreateCustomFieldState = {
  error?: string;
  success?: boolean;
};

export async function createCustomFieldAction(
  _prevState: CreateCustomFieldState,
  formData: FormData,
): Promise<CreateCustomFieldState> {
  const name = (formData.get("name") as string)?.trim();
  const type = (formData.get("type") as string)?.trim() as CustomFieldType;
  const target = (formData.get("target") as string)?.trim() as CustomFieldTarget;
  const optionsRaw = (formData.get("options") as string)?.trim() ?? "";
  const isRequired = formData.get("is_required") === "on";
  const isUnique = formData.get("is_unique") === "on";

  if (!name) return { error: "O nome é obrigatório." };
  if (!type) return { error: "Selecione um tipo." };
  if (!target) return { error: "Selecione um alvo." };

  // Options: texto multilinha → array de strings não vazias
  let options: string[] | undefined;
  if (TYPES_WITH_OPTIONS.includes(type)) {
    const parsed = optionsRaw
      .split("\n")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (parsed.length === 0) {
      return {
        error: "Adicione pelo menos uma opção para o tipo select/multiselect.",
      };
    }
    options = parsed;
  }

  try {
    await createCustomField({
      name,
      type,
      target,
      options,
      is_required: isRequired,
      is_unique: isUnique,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao criar campo. Tente novamente." };
  }

  revalidatePath("/settings/custom-fields");
  return { success: true };
}

export type DeleteCustomFieldState = { error?: string } | null;

export async function deleteCustomFieldAction(
  fieldId: string,
  _prevState: DeleteCustomFieldState,
  _formData: FormData,
): Promise<DeleteCustomFieldState> {
  try {
    await deleteCustomField(fieldId);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao excluir campo. Tente novamente." };
  }

  revalidatePath("/settings/custom-fields");
  return null;
}

export type UpdateCustomFieldState = {
  error?: string;
  success?: boolean;
};

export async function updateCustomFieldAction(
  fieldId: string,
  fieldType: CustomFieldType,
  _prevState: UpdateCustomFieldState,
  formData: FormData,
): Promise<UpdateCustomFieldState> {
  const name = (formData.get("name") as string)?.trim();
  const optionsRaw = (formData.get("options") as string)?.trim() ?? "";
  const isRequired = formData.get("is_required") === "on";
  const isUnique = formData.get("is_unique") === "on";

  if (!name) return { error: "O nome é obrigatório." };

  let options: string[] | null = null;
  if (TYPES_WITH_OPTIONS.includes(fieldType)) {
    const parsed = optionsRaw
      .split("\n")
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (parsed.length === 0) {
      return {
        error: "Adicione pelo menos uma opção para o tipo select/multiselect.",
      };
    }
    options = parsed;
  }

  try {
    await updateCustomField(fieldId, {
      name,
      options,
      is_required: isRequired,
      is_unique: isUnique,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao atualizar campo. Tente novamente." };
  }

  revalidatePath("/settings/custom-fields");
  return { success: true };
}