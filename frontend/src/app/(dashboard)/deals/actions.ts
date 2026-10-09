"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createDeal, updateDeal, deleteDeal } from "@/lib/api/deals";
import { ApiError } from "@/lib/api/client";
import { parseCustomValues } from "@/lib/forms/parse-custom-values";

// ============================================================
// Criar deal
// ============================================================

export type CreateDealState = {
  error?: string;
  success?: boolean;
};

export async function createDealAction(
  _prevState: CreateDealState,
  formData: FormData,
): Promise<CreateDealState> {
  const leadId = (formData.get("lead_id") as string)?.trim();
  const pipelineId = (formData.get("pipeline_id") as string)?.trim();
  const stageId = (formData.get("stage_id") as string)?.trim() || undefined;
  const valueRaw = (formData.get("value") as string)?.trim();
  const expectedCloseDate =
    (formData.get("expected_close_date") as string)?.trim() || null;
  const probabilityRaw = (formData.get("probability") as string)?.trim();

  if (!leadId) return { error: "Selecione um lead." };
  if (!pipelineId) return { error: "Selecione um pipeline." };
  if (!valueRaw) return { error: "Informe um valor." };

  const value = Number(valueRaw.replace(",", "."));
  if (isNaN(value) || value <= 0) {
    return { error: "O valor deve ser maior que zero." };
  }

  const probability = probabilityRaw ? Number(probabilityRaw) : 0;
  if (isNaN(probability) || probability < 0 || probability > 100) {
    return { error: "A probabilidade deve estar entre 0 e 100." };
  }

  const custom_values = parseCustomValues(formData);

  try {
    await createDeal({
      lead_id: leadId,
      pipeline_id: pipelineId,
      stage_id: stageId,
      value: String(value),
      expected_close_date: expectedCloseDate,
      probability,
      custom_values,
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao criar negócio. Tente novamente." };
  }

  revalidatePath("/deals");
  revalidatePath("/pipelines");
  return { success: true };
}

// ============================================================
// Atualizar deal (edição completa via modal)
// ============================================================

export type UpdateDealState = {
  error?: string;
  success?: boolean;
};

export async function updateDealAction(
  dealId: string,
  _prevState: UpdateDealState,
  formData: FormData,
): Promise<UpdateDealState> {
  const valueRaw = (formData.get("value") as string)?.trim();
  const creditRaw = (formData.get("credit_value") as string)?.trim();
  const downRaw = (formData.get("down_payment") as string)?.trim();
  const installmentRaw = (formData.get("installment") as string)?.trim();
  const probabilityRaw = (formData.get("probability") as string)?.trim();
  const expectedCloseDate =
    (formData.get("expected_close_date") as string)?.trim() || null;

  if (!valueRaw) return { error: "Informe um valor." };

  const value = Number(valueRaw.replace(",", "."));
  if (isNaN(value) || value <= 0) {
    return { error: "O valor deve ser maior que zero." };
  }

  const probability = probabilityRaw ? Number(probabilityRaw) : 0;
  if (isNaN(probability) || probability < 0 || probability > 100) {
    return { error: "A probabilidade deve estar entre 0 e 100." };
  }

  const parseDecimal = (v: string): string | null => {
    if (!v) return null;
    const n = Number(v.replace(",", "."));
    return isNaN(n) ? null : String(n);
  };

  const payload: Record<string, unknown> = {
    value: String(value),
    credit_value: parseDecimal(creditRaw),
    down_payment: parseDecimal(downRaw),
    installment: parseDecimal(installmentRaw),
    probability,
    expected_close_date: expectedCloseDate,
  };

  const customValues = parseCustomValues(formData);
  if (Object.keys(customValues).length > 0) {
    payload.custom_values = customValues;
  }

  try {
    await updateDeal(dealId, payload);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao atualizar negócio. Tente novamente." };
  }

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/pipelines");
  return { success: true };
}

// ============================================================
// Mover deal (kanban drag-and-drop)
// ============================================================

export type MoveDealState = {
  error?: string;
  success?: boolean;
};

export async function moveDeal(
  dealId: string,
  newStageId: string,
  newStatus: "open" | "won" | "lost" | undefined,
  revalidatePathname: string = "/deals",
): Promise<MoveDealState> {
  try {
    await updateDeal(dealId, {
      stage_id: newStageId,
      ...(newStatus ? { status: newStatus } : {}),
    });
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao mover negócio. Tente novamente." };
  }

  revalidatePath(revalidatePathname);
  revalidatePath("/deals");
  revalidatePath("/pipelines");
  return { success: true };
}

// ============================================================
// Excluir deal
// ============================================================

export type DeleteDealState = { error?: string } | null;

export async function deleteDealAction(
  dealId: string,
  _prevState: DeleteDealState,
  _formData: FormData,
): Promise<DeleteDealState> {
  try {
    await deleteDeal(dealId);
  } catch (err) {
    if (err instanceof ApiError) {
      return { error: err.detail };
    }
    return { error: "Erro ao excluir negócio. Tente novamente." };
  }

  revalidatePath("/deals");
  redirect("/deals");
}