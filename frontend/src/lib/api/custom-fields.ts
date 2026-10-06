import { apiFetch } from "./client";
import type {
  CustomField,
  CustomFieldTarget,
  CustomFieldType,
} from "./types";

export type ListCustomFieldsParams = {
  target?: CustomFieldTarget;
};

export async function listCustomFields(
  params: ListCustomFieldsParams = {},
): Promise<CustomField[]> {
  const qs = new URLSearchParams();
  if (params.target) qs.set("target", params.target);
  const query = qs.toString();
  return apiFetch<CustomField[]>(
    `/custom-fields${query ? `?${query}` : ""}`,
  );
}

export type CreateCustomFieldInput = {
  name: string;
  type: CustomFieldType;
  target: CustomFieldTarget;
  options?: unknown[];
  is_required?: boolean;
  is_unique?: boolean;
};

export async function createCustomField(
  data: CreateCustomFieldInput,
): Promise<CustomField> {
  return apiFetch<CustomField>("/custom-fields", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteCustomField(id: string): Promise<void> {
  return apiFetch<void>(`/custom-fields/${id}`, { method: "DELETE" });
}

export type UpdateCustomFieldInput = {
  name?: string;
  options?: unknown[] | null;
  is_required?: boolean;
  is_unique?: boolean;
};

export async function updateCustomField(
  id: string,
  data: UpdateCustomFieldInput,
): Promise<CustomField> {
  return apiFetch<CustomField>(`/custom-fields/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}