import { apiFetch } from "./client";
import type { Lead, LeadListResponse } from "./types";

export type ListLeadsParams = {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  pipeline_id?: string;
  stage_id?: string;
};

export async function listLeads(
  params: ListLeadsParams = {},
): Promise<LeadListResponse> {
  const qs = new URLSearchParams();

  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.search) qs.set("search", params.search);
  if (params.status) qs.set("status", params.status);
  if (params.pipeline_id) qs.set("pipeline_id", params.pipeline_id);
  if (params.stage_id) qs.set("stage_id", params.stage_id);

  const query = qs.toString();
  return apiFetch<LeadListResponse>(`/leads${query ? `?${query}` : ""}`);
}

export async function getLead(id: string): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`);
}

export type UpdateLeadInput = {
  name?: string;
  source?: string | null;
  status?: string;
  contact_info?: Record<string, unknown>;
};

export async function updateLead(
  id: string,
  data: UpdateLeadInput,
): Promise<Lead> {
  return apiFetch<Lead>(`/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteLead(id: string): Promise<void> {
  return apiFetch<void>(`/leads/${id}`, { method: "DELETE" });
}