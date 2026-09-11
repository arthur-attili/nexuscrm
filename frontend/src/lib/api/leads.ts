import { apiFetch } from "./client";
import type { LeadListResponse } from "./types";

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