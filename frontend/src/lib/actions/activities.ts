"use server";

import { revalidatePath } from "next/cache";

import {
  createActivity,
  deleteActivity,
  updateActivity,
} from "@/lib/api/activities";
import { ApiError } from "@/lib/api/client";
import type { ActivityRecordType, ActivityType } from "@/lib/api/types";

// ============================================================
// Criar
// ============================================================

export type CreateActivityState = {
  error?: string;
  success?: boolean;
};

export async function createActivityAction(
  recordType: ActivityRecordType,
  recordId: string,
  revalidatePathname: string,
  _prevState: CreateActivityState,
  formData: FormData,
): Promise<CreateActivityState> {
  const type = (formData.get("type") as string)?.trim() as ActivityType;
  const description = (formData.get("description") as string)?.trim() || null;
  const dueDateRaw = (formData.get("due_date") as string)?.trim() || null;

  if (!type) {
    return { error: "Selecione o tipo de atividade." };
  }

  // Converte datetime-local (YYYY-MM-DDTHH:MM) para ISO
  const due_date = dueDateRaw ? new Date(dueDateRaw).toISOString() : null;

  try {
    await createActivity({
      record_type: recordType,
      record_id: recordId,
      type,
      description,
      due_date,
    });
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao criar atividade. Tente novamente." };
  }

  revalidatePath(revalidatePathname);
  return { success: true };
}

// ============================================================
// Atualizar (usado para toggle de conclusão)
// ============================================================

export type UpdateActivityState = {
  error?: string;
  success?: boolean;
};

export async function updateActivityAction(
  activityId: string,
  revalidatePathname: string,
  _prevState: UpdateActivityState,
  formData: FormData,
): Promise<UpdateActivityState> {
  const completedRaw = formData.get("completed") as string | null;
  const description = (formData.get("description") as string)?.trim() || null;
  const dueDateRaw = (formData.get("due_date") as string)?.trim() || null;
  const typeRaw = (formData.get("type") as string)?.trim() || null;

  const payload: {
    completed?: boolean;
    description?: string | null;
    due_date?: string | null;
    type?: ActivityType;
  } = {};

  if (completedRaw !== null) {
    payload.completed = completedRaw === "true";
  }
  if (description !== null) {
    payload.description = description;
  }
  if (dueDateRaw) {
    payload.due_date = new Date(dueDateRaw).toISOString();
  }
  if (typeRaw) {
    payload.type = typeRaw as ActivityType;
  }

  try {
    await updateActivity(activityId, payload);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao atualizar atividade." };
  }

  revalidatePath(revalidatePathname);
  return { success: true };
}

// ============================================================
// Deletar
// ============================================================

export type DeleteActivityState = {
  error?: string;
  success?: boolean;
};

export async function deleteActivityAction(
  activityId: string,
  revalidatePathname: string,
  _prevState: DeleteActivityState,
  _formData: FormData,
): Promise<DeleteActivityState> {
  try {
    await deleteActivity(activityId);
  } catch (err) {
    if (err instanceof ApiError) return { error: err.detail };
    return { error: "Erro ao excluir atividade. Tente novamente." };
  }

  revalidatePath(revalidatePathname);
  return { success: true };
}