"use server";

import { revalidatePath } from "next/cache";

import {
  createPipeline,
  updatePipeline,
  deletePipeline,
  createStage,
  updateStage,
  deleteStage,
} from "@/lib/api/pipelines";
import { ApiError } from "@/lib/api/client";

// ============================================================
// Pipelines
// ============================================================

export type CreatePipelineState = {
  error?: string;
  success?: boolean;
};

export async function createPipelineAction(
  _prevState: CreatePipelineState,
  formData: FormData,
): Promise<CreatePipelineState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const isDefault = formData.get("is_default") === "on";

  if (!name) return { error: "O nome é obrigatório." };

  try {
    await createPipeline({ name, description, is_default: isDefault });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao criar pipeline. Tente novamente." };
  }

  revalidatePath("/settings/pipelines");
  revalidatePath("/deals");
  return { success: true };
}

export type UpdatePipelineState = {
  error?: string;
  success?: boolean;
};

export async function updatePipelineAction(
  pipelineId: string,
  _prevState: UpdatePipelineState,
  formData: FormData,
): Promise<UpdatePipelineState> {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const isDefault = formData.get("is_default") === "on";

  if (!name) return { error: "O nome é obrigatório." };

  try {
    await updatePipeline(pipelineId, {
      name,
      description,
      is_default: isDefault,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao atualizar pipeline. Tente novamente." };
  }

  revalidatePath("/settings/pipelines");
  revalidatePath("/deals");
  return { success: true };
}

export type DeletePipelineState = { error?: string } | null;

export async function deletePipelineAction(
  pipelineId: string,
  _prevState: DeletePipelineState,
  _formData: FormData,
): Promise<DeletePipelineState> {
  try {
    await deletePipeline(pipelineId);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao excluir pipeline. Tente novamente." };
  }

  revalidatePath("/settings/pipelines");
  revalidatePath("/deals");
  return null;
}

// ============================================================
// Stages
// ============================================================

export type CreateStageState = {
  error?: string;
  success?: boolean;
};

export async function createStageAction(
  pipelineId: string,
  _prevState: CreateStageState,
  formData: FormData,
): Promise<CreateStageState> {
  const name = (formData.get("name") as string)?.trim();
  const orderRaw = (formData.get("order") as string)?.trim();
  const isWon = formData.get("is_won") === "on";
  const isLost = formData.get("is_lost") === "on";

  if (!name) return { error: "O nome é obrigatório." };

  const order = orderRaw ? Number(orderRaw) : 0;
  if (isNaN(order) || order < 0) {
    return { error: "A ordem deve ser um número positivo." };
  }

  try {
    await createStage(pipelineId, {
      name,
      order,
      is_won: isWon,
      is_lost: isLost,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao criar estágio. Tente novamente." };
  }

  revalidatePath("/settings/pipelines");
  revalidatePath("/deals");
  return { success: true };
}

export type UpdateStageState = {
  error?: string;
  success?: boolean;
};

export async function updateStageAction(
  stageId: string,
  _prevState: UpdateStageState,
  formData: FormData,
): Promise<UpdateStageState> {
  const name = (formData.get("name") as string)?.trim();
  const orderRaw = (formData.get("order") as string)?.trim();
  const isWon = formData.get("is_won") === "on";
  const isLost = formData.get("is_lost") === "on";

  if (!name) return { error: "O nome é obrigatório." };

  const order = orderRaw ? Number(orderRaw) : 0;
  if (isNaN(order) || order < 0) {
    return { error: "A ordem deve ser um número positivo." };
  }

  try {
    await updateStage(stageId, {
      name,
      order,
      is_won: isWon,
      is_lost: isLost,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao atualizar estágio. Tente novamente." };
  }

  revalidatePath("/settings/pipelines");
  revalidatePath("/deals");
  return { success: true };
}

export type DeleteStageState = { error?: string } | null;

export async function deleteStageAction(
  stageId: string,
  _prevState: DeleteStageState,
  _formData: FormData,
): Promise<DeleteStageState> {
  try {
    await deleteStage(stageId);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao excluir estágio. Tente novamente." };
  }

  revalidatePath("/settings/pipelines");
  revalidatePath("/deals");
  return null;
}