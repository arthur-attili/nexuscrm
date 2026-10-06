import { apiFetch } from "./client";
import type { Deal, DealListResponse } from "./types";

export type ListDealsParams = {
  page?: number;
  page_size?: number;
  pipeline_id?: string;
  stage_id?: string;
  status?: string;
  lead_id?: string;
};

export async function listDeals(
  params: ListDealsParams = {},
): Promise<DealListResponse> {
  const qs = new URLSearchParams();

  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.pipeline_id) qs.set("pipeline_id", params.pipeline_id);
  if (params.stage_id) qs.set("stage_id", params.stage_id);
  if (params.status) qs.set("status", params.status);
  if (params.lead_id) qs.set("lead_id", params.lead_id);

  const query = qs.toString();
  return apiFetch<DealListResponse>(`/deals${query ? `?${query}` : ""}`);
}

export async function getDeal(id: string): Promise<Deal> {
  return apiFetch<Deal>(`/deals/${id}`);
}

export type CreateDealInput = {
  lead_id: string;
  pipeline_id: string;
  stage_id?: string;
  value: string;
  expected_close_date?: string | null;
  probability?: number;
  custom_values?: Record<string, unknown>;
};

export async function createDeal(data: CreateDealInput): Promise<Deal> {
  return apiFetch<Deal>("/deals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateDealInput = {
  stage_id?: string;
  pipeline_id?: string;
  value?: string;
  credit_value?: string | null;
  down_payment?: string | null;
  installment?: string | null;
  probability?: number;
  expected_close_date?: string | null;
  status?: "open" | "won" | "lost";
  custom_values?: Record<string, unknown>;
};

export async function updateDeal(
  id: string,
  data: UpdateDealInput,
): Promise<Deal> {
  return apiFetch<Deal>(`/deals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteDeal(id: string): Promise<void> {
  return apiFetch<void>(`/deals/${id}`, { method: "DELETE" });
}