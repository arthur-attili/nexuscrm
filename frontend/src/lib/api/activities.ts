import { apiFetch } from "./client";
import type { Activity, ActivityRecordType, ActivityType } from "./types";

export async function listActivities(
  recordType: ActivityRecordType,
  recordId: string,
): Promise<Activity[]> {
  const qs = new URLSearchParams({
    record_type: recordType,
    record_id: recordId,
  });
  return apiFetch<Activity[]>(`/activities?${qs.toString()}`);
}

export type CreateActivityInput = {
  record_type: ActivityRecordType;
  record_id: string;
  type: ActivityType;
  description?: string | null;
  due_date?: string | null;
};

export async function createActivity(
  data: CreateActivityInput,
): Promise<Activity> {
  return apiFetch<Activity>("/activities", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateActivityInput = {
  type?: ActivityType;
  description?: string | null;
  due_date?: string | null;
  completed?: boolean;
};

export async function updateActivity(
  id: string,
  data: UpdateActivityInput,
): Promise<Activity> {
  return apiFetch<Activity>(`/activities/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteActivity(id: string): Promise<void> {
  return apiFetch<void>(`/activities/${id}`, { method: "DELETE" });
}