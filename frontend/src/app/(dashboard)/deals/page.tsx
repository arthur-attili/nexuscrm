import { listPipelines, getPipeline } from "@/lib/api/pipelines";
import { listDeals } from "@/lib/api/deals";
import { listLeads } from "@/lib/api/leads";
import { listCustomFields } from "@/lib/api/custom-fields";
import { ApiError } from "@/lib/api/client";
import { KanbanBoard } from "./kanban-board";
import { NewDealModal } from "./new-deal-modal";
import type { CustomField, Stage } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  let error: string | null = null;

  let pipelineName = "";
  let pipelineId = "";
  let stages: Stage[] = [];
  let deals: Awaited<ReturnType<typeof listDeals>>["items"] = [];
  let leads: Awaited<ReturnType<typeof listLeads>>["items"] = [];
  let pipelines: Awaited<ReturnType<typeof listPipelines>> = [];
  let stagesByPipeline: Record<string, Stage[]> = {};
  let customFields: CustomField[] = [];

  try {
    pipelines = await listPipelines();
    if (pipelines.length === 0) {
      return <EmptyState />;
    }
    const pipeline = pipelines.find((p) => p.is_default) ?? pipelines[0];
    pipelineId = pipeline.id;
    pipelineName = pipeline.name;

    const [full, dealsRes, leadsRes, customFieldsRes] = await Promise.all([
      getPipeline(pipeline.id),
      listDeals({ pipeline_id: pipeline.id, page_size: 100 }),
      listLeads({ page_size: 100 }),
      listCustomFields({ target: "deal" }).catch(() => []),
    ]);
    stages = full.stages;
    deals = dealsRes.items;
    leads = leadsRes.items;
    customFields = customFieldsRes;

    const pipelinesWithStages = await Promise.all(
      pipelines.map((p) => getPipeline(p.id)),
    );
    stagesByPipeline = Object.fromEntries(
      pipelinesWithStages.map((p) => [p.id, p.stages]),
    );
  } catch (err) {
    if (err instanceof ApiError) {
      error = err.detail;
    } else {
      error = "Erro ao carregar negócios.";
    }
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Negócios</h1>
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-3 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Negócios</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {pipelineName} · {deals.length} negócio{deals.length === 1 ? "" : "s"}
          </p>
        </div>
        <NewDealModal
          leads={leads}
          pipelines={pipelines}
          stagesByPipeline={stagesByPipeline}
          defaultPipelineId={pipelineId}
          customFields={customFields}
        />
      </div>

      <KanbanBoard stages={stages} deals={deals} />
    </div>
  );
}

function EmptyState() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Negócios</h1>
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
        <p className="text-zinc-400">
          Nenhum pipeline configurado. Crie um pipeline primeiro.
        </p>
      </div>
    </div>
  );
}