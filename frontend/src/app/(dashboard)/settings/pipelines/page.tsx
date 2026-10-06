import { notFound } from "next/navigation";
import { GitBranch } from "lucide-react";

import { listPipelines, getPipeline } from "@/lib/api/pipelines";
import { getMyProfile } from "@/lib/api/profile";
import { ApiError } from "@/lib/api/client";
import { NewPipelineModal } from "./new-pipeline-modal";
import { EditPipelineModal } from "./edit-pipeline-modal";
import { DeletePipelineButton } from "./delete-pipeline-button";
import { NewStageModal } from "./new-stage-modal";
import { EditStageModal } from "./edit-stage-modal";
import { DeleteStageButton } from "./delete-stage-button";
import type { Pipeline, Stage } from "@/lib/api/types";

export default async function PipelinesSettingsPage() {
  // Só admin
  let profile;
  try {
    profile = await getMyProfile();
  } catch {
    notFound();
  }
  if (profile.role !== "admin") notFound();

  let pipelines: Pipeline[] = [];
  let stagesByPipeline: Record<string, Stage[]> = {};

  try {
    pipelines = await listPipelines();

    const full = await Promise.all(
      pipelines.map((p) => getPipeline(p.id).catch(() => null)),
    );
    stagesByPipeline = Object.fromEntries(
      full
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => [p.id, p.stages]),
    );
  } catch (err) {
    if (err instanceof ApiError) notFound();
    throw err;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Pipelines</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie os funis de venda e suas etapas
          </p>
        </div>
        <NewPipelineModal />
      </div>

      {pipelines.length === 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
          <GitBranch className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Nenhum pipeline criado ainda.</p>
          <p className="text-zinc-500 text-sm mt-1">
            Clique em "Novo Pipeline" para começar.
          </p>
        </div>
      )}

      {pipelines.map((pipeline) => (
        <PipelineCard
          key={pipeline.id}
          pipeline={pipeline}
          stages={stagesByPipeline[pipeline.id] ?? []}
        />
      ))}
    </div>
  );
}

function PipelineCard({
  pipeline,
  stages,
}: {
  pipeline: Pipeline;
  stages: Stage[];
}) {
  // Sugestão de próxima ordem para nova etapa
  const nextOrder =
    stages.length > 0 ? Math.max(...stages.map((s) => s.order)) + 1 : 1;

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base font-semibold text-white">
              {pipeline.name}
            </h3>
            {pipeline.is_default && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
                padrão
              </span>
            )}
          </div>
          {pipeline.description && (
            <p className="text-sm text-zinc-400 mb-2">
              {pipeline.description}
            </p>
          )}
          <p className="text-xs text-zinc-500">
            {stages.length} {stages.length === 1 ? "etapa" : "etapas"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <EditPipelineModal pipeline={pipeline} />
          <DeletePipelineButton
            pipelineId={pipeline.id}
            pipelineName={pipeline.name}
          />
        </div>
      </div>

      {/* Lista de stages */}
      <div className="mt-4 pt-4 border-t border-zinc-900">
        {stages.length === 0 ? (
          <p className="text-sm text-zinc-500 py-2">
            Nenhuma etapa criada ainda.
          </p>
        ) : (
          <div className="space-y-1">
            {stages.map((stage) => (
              <StageRow key={stage.id} stage={stage} />
            ))}
          </div>
        )}

        <div className="mt-3">
          <NewStageModal pipelineId={pipeline.id} nextOrder={nextOrder} />
        </div>
      </div>
    </div>
  );
}

function StageRow({ stage }: { stage: Stage }) {
  return (
    <div className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-900/50 transition-colors">
      {/* Ordem */}
      <span className="text-xs font-mono text-zinc-500 w-6 text-center shrink-0">
        {stage.order}
      </span>

      {/* Nome */}
      <span className="text-sm text-white flex-1 truncate">{stage.name}</span>

      {/* Badges */}
      <div className="flex items-center gap-1.5 shrink-0">
        {stage.is_won && (
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
            won
          </span>
        )}
        {stage.is_lost && (
          <span className="text-xs px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-900">
            lost
          </span>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <EditStageModal stage={stage} />
        <DeleteStageButton stageId={stage.id} stageName={stage.name} />
      </div>
    </div>
  );
}