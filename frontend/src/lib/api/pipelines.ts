import { apiFetch } from "./client";
import type {
  Pipeline,
  PipelineWithStages,
  Stage,
} from "./types";

// ============================================================
// Pipelines
// ============================================================

export async function listPipelines(): Promise<Pipeline[]> {
  return apiFetch<Pipeline[]>("/pipelines");
}

export async function getPipeline(id: string): Promise<PipelineWithStages> {
  return apiFetch<PipelineWithStages>(`/pipelines/${id}`);
}

export type CreatePipelineInput = {
  name: string;
  description?: string | null;
  is_default?: boolean;
};

export async function createPipeline(
  data: CreatePipelineInput,
): Promise<Pipeline> {
  return apiFetch<Pipeline>("/pipelines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdatePipelineInput = {
  name?: string;
  description?: string | null;
  is_default?: boolean;
};

export async function updatePipeline(
  id: string,
  data: UpdatePipelineInput,
): Promise<Pipeline> {
  return apiFetch<Pipeline>(`/pipelines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deletePipeline(id: string): Promise<void> {
  return apiFetch<void>(`/pipelines/${id}`, { method: "DELETE" });
}

// ============================================================
// Stages
// ============================================================

export type CreateStageInput = {
  name: string;
  order: number;
  is_won?: boolean;
  is_lost?: boolean;
};

export async function createStage(
  pipelineId: string,
  data: CreateStageInput,
): Promise<Stage> {
  return apiFetch<Stage>(`/pipelines/${pipelineId}/stages`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateStageInput = {
  name?: string;
  order?: number;
  is_won?: boolean;
  is_lost?: boolean;
};

export async function updateStage(
  stageId: string,
  data: UpdateStageInput,
): Promise<Stage> {
  return apiFetch<Stage>(`/pipelines/stages/${stageId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteStage(stageId: string): Promise<void> {
  return apiFetch<void>(`/pipelines/stages/${stageId}`, {
    method: "DELETE",
  });
}