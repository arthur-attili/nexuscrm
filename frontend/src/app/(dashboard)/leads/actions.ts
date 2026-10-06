"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiFetch, ApiError } from "@/lib/api/client";
import { updateLead, deleteLead } from "@/lib/api/leads";
import { parseCustomValues } from "@/lib/forms/parse-custom-values";
import type { Lead } from "@/lib/api/types";

// ============================================================
// Criar
// ============================================================

export type CreateLeadState = {
  error?: string;
  success?: boolean;
};

export async function createLead(
  _prevState: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const name = (formData.get("name") as string)?.trim();
  const source = (formData.get("source") as string)?.trim() || null;
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!name) {
    return { error: "O nome é obrigatório." };
  }

  const contact_info: Record<string, string> = {};
  if (phone) contact_info.phone = phone;
  if (email) contact_info.email = email;

  const custom_values = parseCustomValues(formData);

  try {
    await apiFetch<Lead>("/leads", {
      method: "POST",
      body: JSON.stringify({
        name,
        source,
        contact_info,
        custom_values,
      }),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao criar lead. Tente novamente." };
  }

  revalidatePath("/leads");
  return { success: true };
}

// ============================================================
// Atualizar
// ============================================================

export type UpdateLeadState = {
  error?: string;
  success?: boolean;
};

export async function updateLeadAction(
  leadId: string,
  _prevState: UpdateLeadState,
  formData: FormData,
): Promise<UpdateLeadState> {
  const name = (formData.get("name") as string)?.trim();
  const source = (formData.get("source") as string)?.trim() || null;
  const status = (formData.get("status") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  const extraContact = JSON.parse(
    (formData.get("_extra_contact") as string) || "{}",
  ) as Record<string, unknown>;

  if (!name) {
    return { error: "O nome é obrigatório." };
  }

  const contact_info: Record<string, unknown> = { ...extraContact };
  if (phone) contact_info.phone = phone;
  if (email) contact_info.email = email;

  const payload: Record<string, unknown> = {
    name,
    source,
    contact_info,
  };
  if (status) payload.status = status;

  const customValues = parseCustomValues(formData);
  if (Object.keys(customValues).length > 0) {
    payload.custom_values = customValues;
  }

  try {
    await updateLead(leadId, payload);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao atualizar lead. Tente novamente." };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  return { success: true };
}

// ============================================================
// Excluir
// ============================================================

export type DeleteLeadState = { error?: string } | null;

export async function deleteLeadAction(
  leadId: string,
  _prevState: DeleteLeadState,
  _formData: FormData,
): Promise<DeleteLeadState> {
  try {
    await deleteLead(leadId);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao excluir lead. Tente novamente." };
  }

  revalidatePath("/leads");
  redirect("/leads");
}