import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";

import { getPipeline } from "@/lib/api/pipelines";
import { listDeals } from "@/lib/api/deals";
import { ApiError } from "@/lib/api/client";
import { KanbanBoard } from "@/app/(dashboard)/deals/kanban-board";
import type { Stage } from "@/lib/api/types";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PipelineKanbanPage({ params }: Props) {
  const { id } = await params;

  let pipeline;
  let stages: Stage[] = [];
  let deals: Awaited<ReturnType<typeof listDeals>>["items"] = [];
  let error: string | null = null;

  try {
    const [full, dealsRes] = await Promise.all([
      getPipeline(id),
      listDeals({ pipeline_id: id, page_size: 100 }),
    ]);
    pipeline = full;
    stages = full.stages;
    deals = dealsRes.items;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
      notFound();
    }
    if (err instanceof ApiError) {
      error = err.detail;
    } else {
      error = "Erro ao carregar pipeline.";
    }
  }

  if (error || !pipeline) {
    return (
      <div>
        <Link
          href="/pipelines"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Pipelines
        </Link>
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-3 text-sm">
          {error ?? "Pipeline não encontrado."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Voltar */}
      <Link
        href="/pipelines"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4 self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para Pipelines
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <GitBranch className="w-5 h-5 text-zinc-500" />
          <h1 className="text-2xl font-bold text-white">{pipeline.name}</h1>
          {pipeline.is_default && (
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
              padrão
            </span>
          )}
        </div>
        {pipeline.description && (
          <p className="text-zinc-400 text-sm">{pipeline.description}</p>
        )}
        <p className="text-zinc-500 text-sm mt-2">
          {stages.length} {stages.length === 1 ? "etapa" : "etapas"} ·{" "}
          {deals.length} {deals.length === 1 ? "negócio" : "negócios"}
        </p>
      </div>

      {/* Kanban */}
      {stages.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-400">Este pipeline não tem etapas ainda.</p>
          <p className="text-zinc-500 text-sm mt-1">
            Configure em <strong>Configurações → Pipelines</strong>.
          </p>
        </div>
      ) : (
        <KanbanBoard
          stages={stages}
          deals={deals}
          revalidatePathname={`/pipelines/${id}`}
        />
      )}
    </div>
  );
}