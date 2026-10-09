"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import type { Deal, Stage } from "@/lib/api/types";
import { DealCard } from "./deal-card";
import { moveDeal } from "./actions";

type Props = {
  stages: Stage[];
  deals: Deal[];
  revalidatePathname?: string;
};

export function KanbanBoard({
  stages,
  deals,
  revalidatePathname = "/deals",
}: Props) {
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const dealsSignature = useMemo(
    () =>
      deals
        .map((d) => `${d.id}:${d.stage_id}:${d.status}:${d.value}`)
        .sort()
        .join("|"),
    [deals],
  );

  useEffect(() => {
    setLocalDeals(deals);
  }, [dealsSignature, deals]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  function handleDragStart(event: DragStartEvent) {
    const deal = event.active.data.current?.deal as Deal | undefined;
    setActiveDeal(deal ?? null);
    setError(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);

    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const newStageId = String(over.id);

    const deal = localDeals.find((d) => d.id === dealId);
    if (!deal) return;
    if (deal.stage_id === newStageId) return;

    const newStage = stages.find((s) => s.id === newStageId);
    if (!newStage) return;

    let newStatus: "open" | "won" | "lost" = "open";
    if (newStage.is_won) newStatus = "won";
    else if (newStage.is_lost) newStatus = "lost";

    const previousDeals = localDeals;
    setLocalDeals((prev) =>
      prev.map((d) =>
        d.id === dealId ? { ...d, stage_id: newStageId, status: newStatus } : d,
      ),
    );

    startTransition(async () => {
      const result = await moveDeal(
        dealId,
        newStageId,
        newStatus,
        revalidatePathname,
      );
      if (result.error) {
        setLocalDeals(previousDeals);
        setError(result.error);
        setTimeout(() => setError(null), 4000);
      }
    });
  }

  const dealsByStage = new Map<string, Deal[]>();
  for (const stage of stages) dealsByStage.set(stage.id, []);
  for (const deal of localDeals) {
    if (deal.stage_id && dealsByStage.has(deal.stage_id)) {
      dealsByStage.get(deal.stage_id)!.push(deal);
    }
  }

  return (
    <>
      {error && (
        <div className="mb-4 bg-red-950/40 border border-red-800 text-red-300 rounded-md px-4 py-2 text-sm flex items-center gap-2">
          <span className="font-medium">Não foi possível mover:</span>
          {error}
        </div>
      )}

      <DndContext
        id="deals-kanban"
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-h-full pb-4">
            {stages.map((stage) => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                deals={dealsByStage.get(stage.id) ?? []}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="w-72 opacity-90">
              <DealCard deal={activeDeal} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

function KanbanColumn({ stage, deals }: { stage: Stage; deals: Deal[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + Number(d.value), 0);

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 flex flex-col bg-zinc-950/50 border rounded-lg transition-colors ${
        isOver ? "border-blue-600 bg-blue-950/20" : "border-zinc-800"
      }`}
    >
      <div className="px-3 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{stage.name}</h3>
            {stage.is_won && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900">
                won
              </span>
            )}
            {stage.is_lost && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-950 text-red-400 border border-red-900">
                lost
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-500">{deals.length}</span>
        </div>
        {total > 0 && (
          <p className="text-xs text-zinc-500">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(total)}
          </p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
        {deals.length === 0 && (
          <div className="text-xs text-zinc-600 text-center py-6">
            Nenhum negócio
          </div>
        )}
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}