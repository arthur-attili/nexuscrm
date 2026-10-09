import Link from "next/link";
import { GitBranch, Briefcase, DollarSign } from "lucide-react";

import { listPipelines, getPipeline } from "@/lib/api/pipelines";
import { listDeals } from "@/lib/api/deals";
import { ApiError } from "@/lib/api/client";
import type { Pipeline, Stage } from "@/lib/api/types";

export const dynamic = "force-dynamic";

export default async function PipelinesPage() {
  let pipelines: Pipeline[] = [];
  let statsByPipeline: Record<
    string,
    { stages: Stage[]; dealCount: number; totalValue: number }
  > = {};
  let error: string | null = null;

  try {
    pipelines = await listPipelines();

    // Busca, para cada pipeline: stages + deals
    const results = await Promise.all(
      pipelines.map(async (p) => {
        const [full, dealsRes] = await Promise.all([
          getPipeline(p.id).catch(() => null),
          listDeals({ pipeline_id: p.id, page_size: 500 }).catch(() => ({
            items: [],
            total: 0,
          })),
        ]);

        const totalValue = dealsRes.items.reduce(
          (sum, d) => sum + Number(d.value),
          0,
        );

        return {
          id: p.id,
          stages: full?.stages ?? [],
          dealCount: dealsRes.total,
          totalValue,
        };
      }),
    );

    statsByPipeline = Object.fromEntries(results.map((r) => [r.id, r]));
  } catch (err) {
    if (err instanceof ApiError) {
      error = err.detail;
    } else {
      error = "Erro ao carregar pipelines.";
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pipelines</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Visualize os funis de venda e seus negócios
        </p>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-3 text-sm mb-4">
          {error}
        </div>
      )}

      {pipelines.length === 0 && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-12 text-center">
          <GitBranch className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-400">Nenhum pipeline configurado.</p>
          <p className="text-zinc-500 text-sm mt-1">
            Peça a um administrador para criar em Configurações.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pipelines.map((pipeline) => {
          const stats = statsByPipeline[pipeline.id];
          return (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              stageCount={stats?.stages.length ?? 0}
              dealCount={stats?.dealCount ?? 0}
              totalValue={stats?.totalValue ?? 0}
            />
          );
        })}
      </div>
    </div>
  );
}

function PipelineCard({
  pipeline,
  stageCount,
  dealCount,
  totalValue,
}: {
  pipeline: Pipeline;
  stageCount: number;
  dealCount: number;
  totalValue: number;
}) {
  return (
    <Link
      href={`/pipelines/${pipeline.id}`}
      className="group bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-lg p-5 transition-colors block"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
              {pipeline.name}
            </h2>
            {pipeline.is_default && (
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
                padrão
              </span>
            )}
          </div>
          {pipeline.description && (
            <p className="text-sm text-zinc-400 line-clamp-2">
              {pipeline.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-zinc-900">
        <Stat
          icon={<GitBranch className="w-3.5 h-3.5" />}
          label="Etapas"
          value={String(stageCount)}
        />
        <Stat
          icon={<Briefcase className="w-3.5 h-3.5" />}
          label="Negócios"
          value={String(dealCount)}
        />
        <Stat
          icon={<DollarSign className="w-3.5 h-3.5" />}
          label="Em jogo"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            notation: "compact",
            maximumFractionDigits: 1,
          }).format(totalValue)}
        />
      </div>
    </Link>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-zinc-500 mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-medium text-white">{value}</p>
    </div>
  );
}